import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PollRequest {
  videoId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const gcpServiceAccountJson = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");

    if (!supabaseUrl || !supabaseKey || !gcpServiceAccountJson) {
      return new Response(
        JSON.stringify({ error: "Missing configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: PollRequest = await req.json();
    const { videoId } = body;

    console.log("Polling video status for:", videoId);

    const { data: video, error: videoError } = await supabase
      .from("generated_videos")
      .select("id, veo_job_id, generation_status, store_id, stores!inner(shop_domain, access_token)")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (video.generation_status === "completed" || video.generation_status === "failed") {
      return new Response(
        JSON.stringify({
          status: video.generation_status,
          message: "Video already processed",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const operationName = video.veo_job_id;
    if (!operationName) {
      return new Response(
        JSON.stringify({ error: "No job ID found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = await getAccessToken(gcpServiceAccountJson);

    const match = operationName.match(/projects\/([^\/]+)\/locations\/([^\/]+)\/publishers\/google\/models\/([^\/]+)/);
    if (!match) {
      console.error('Could not parse operation name:', operationName);
      return new Response(
        JSON.stringify({ error: "Invalid operation name" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [, projectId, location, modelId] = match;

    const checkUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
    const checkResponse = await fetch(checkUrl, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operationName: operationName
      })
    });

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      console.error('Failed to check job status:', errorText);
      return new Response(
        JSON.stringify({ error: "Failed to check job status", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jobStatus = await checkResponse.json();
    console.log('Job status:', jobStatus.done ? 'done' : 'processing');

    if (!jobStatus.done) {
      return new Response(
        JSON.stringify({
          status: "processing",
          message: "Video is still being generated",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (jobStatus.error) {
      console.error("Job completed with error:", jobStatus.error);
      await supabase
        .from("generated_videos")
        .update({
          generation_status: "failed",
          error_message: jobStatus.error.message || "Video generation failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);

      return new Response(
        JSON.stringify({
          status: "failed",
          error: jobStatus.error.message,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const videoBase64 = jobStatus.response?.videos?.[0]?.bytesBase64Encoded;
    if (!videoBase64) {
      console.error("No video data in completed response");
      await supabase
        .from("generated_videos")
        .update({
          generation_status: "failed",
          error_message: "No video data in response",
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);

      return new Response(
        JSON.stringify({
          status: "failed",
          error: "No video data in response",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Converting video from base64...");
    const binaryString = atob(videoBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log("Uploading video to storage...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-videos")
      .upload(`videos/${videoId}.mp4`, bytes, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload video:", uploadError);
      await supabase
        .from("generated_videos")
        .update({
          generation_status: "failed",
          error_message: `Failed to save video: ${uploadError.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoId);

      return new Response(
        JSON.stringify({
          status: "failed",
          error: `Failed to save video: ${uploadError.message}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: urlData } = supabase.storage
      .from("generated-videos")
      .getPublicUrl(`videos/${videoId}.mp4`);

    const videoUrl = urlData?.publicUrl || "";
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    console.log("Updating video record...");
    await supabase
      .from("generated_videos")
      .update({
        generation_status: "completed",
        video_url: videoUrl,
        video_downloaded: true,
        thumbnail_url: null,
        generation_completed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        attached_to_product: false,
        shopify_media_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    console.log("Video processing completed successfully!");

    return new Response(
      JSON.stringify({
        status: "completed",
        message: "Video generated successfully",
        video_url: videoUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const { client_email, private_key } = serviceAccount;

  const now = Math.floor(Date.now() / 1000);
  const expires = now + 3600;

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claim = {
    iss: client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: expires,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBinary(private_key),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  const jwt = `${unsignedToken}.${encodedSignature}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function base64UrlEncode(str: string): string {
  const base64 = btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return base64;
}

function pemToBinary(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
