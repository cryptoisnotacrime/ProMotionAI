import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VideoGenerationRequest {
  videoId: string;
  storeId: string;
  imageUrl?: string;
  imageUrls?: string[];
  prompt: string;
  durationSeconds: number;
  aspectRatio?: string;
  creditsRequired: number;
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
    const gcpProjectId = Deno.env.get("GCP_PROJECT_ID");
    const gcpServiceAccountJson = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase config");
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!gcpProjectId || !gcpServiceAccountJson) {
      console.error("Missing GCP credentials");
      return new Response(
        JSON.stringify({
          error: "Google Cloud credentials not configured.",
          instructions: "Please add GCP_PROJECT_ID and GCP_SERVICE_ACCOUNT_JSON to your Supabase Edge Function secrets. Create a service account in Google Cloud Console with Vertex AI User role and download the JSON key."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: VideoGenerationRequest = await req.json();
    const { videoId, storeId, imageUrl, imageUrls, prompt, durationSeconds, aspectRatio, creditsRequired } = body;

    // Sanitize image URLs by trimming whitespace and newlines
    const images = (imageUrls || (imageUrl ? [imageUrl] : [])).map((url: string) => url.trim());

    console.log("Request received:", { videoId, storeId, imageCount: images.length, durationSeconds, creditsRequired });

    if (!videoId || images.length === 0 || !storeId || !creditsRequired) {
      console.error("Missing required fields:", { videoId, hasImages: images.length > 0, storeId, creditsRequired });
      return new Response(
        JSON.stringify({ error: "Missing required fields", details: { videoId: !!videoId, hasImages: images.length > 0, storeId: !!storeId, creditsRequired: !!creditsRequired } }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching store from database...");
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("credits_remaining, plan_name")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      console.error("Store not found:", storeError);
      return new Response(
        JSON.stringify({ error: "Store not found", details: storeError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Store found, credits:", store.credits_remaining, "plan:", store.plan_name);

    const isProPlan = store.plan_name === 'pro' || store.plan_name === 'enterprise';

    if (images.length > 1 && !isProPlan) {
      console.error("Multi-image requires Pro plan:", { planName: store.plan_name, imageCount: images.length });
      return new Response(
        JSON.stringify({
          error: "Multiple reference images require Pro plan. Upgrade to unlock this feature.",
          planName: store.plan_name,
          imageCount: images.length
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (images.length > 1 && durationSeconds !== 8) {
      console.error("Multi-image requires 8s duration:", { duration: durationSeconds, imageCount: images.length });
      return new Response(
        JSON.stringify({
          error: "Multiple reference images require 8-second videos (Veo 3.1 API requirement).",
          duration: durationSeconds,
          imageCount: images.length
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (store.credits_remaining < creditsRequired) {
      console.error("Insufficient credits:", { available: store.credits_remaining, required: creditsRequired });
      return new Response(
        JSON.stringify({ error: "Insufficient credits", available: store.credits_remaining, required: creditsRequired }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newCredits = store.credits_remaining - creditsRequired;

    console.log(`Deducting ${creditsRequired} credits from store...`);
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        credits_remaining: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (updateError) {
      console.error("Failed to deduct credits:", updateError);
      return new Response(
        JSON.stringify({ error: `Failed to deduct credits: ${updateError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✓ Credits deducted successfully! ${creditsRequired} credits used, ${newCredits} credits remaining`);
    console.log("Recording transaction in credit_transactions table...");
    await supabase.from("credit_transactions").insert({
      store_id: storeId,
      video_id: videoId,
      transaction_type: "usage",
      credits_amount: -creditsRequired,
      credits_before: store.credits_remaining,
      credits_after: newCredits,
      description: `Video generation (${durationSeconds}s)`,
      metadata: {},
    });

    console.log("Updating video status to processing...");
    await supabase
      .from("generated_videos")
      .update({
        generation_status: "processing",
        generation_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    console.log(`Processing ${images.length} image(s)...`);
    const processedImages = [];

    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      console.log(`Fetching image ${i + 1}/${images.length} from:`, imageUrl);

      const imageResponse = await fetch(imageUrl);
      console.log(`Image ${i + 1} fetch response:`, { status: imageResponse.status, ok: imageResponse.ok });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text().catch(() => 'Unable to read error');
        console.error(`Failed to fetch image ${i + 1}:`, { status: imageResponse.status, error: errorText });
        await refundCredits(supabase, storeId, creditsRequired, videoId, `Failed to fetch image ${i + 1}`);
        return new Response(
          JSON.stringify({ error: `Failed to fetch source image ${i + 1}`, details: { status: imageResponse.status, imageUrl } }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`Converting image ${i + 1} to base64...`);
      const imageBuffer = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(imageBuffer);

      let binaryString = '';
      const chunkSize = 8192;
      for (let j = 0; j < uint8Array.length; j += chunkSize) {
        const chunk = uint8Array.subarray(j, Math.min(j + chunkSize, uint8Array.length));
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const imageBase64 = btoa(binaryString);
      console.log(`Image ${i + 1} converted to base64, length:`, imageBase64.length);

      const contentType = imageResponse.headers.get('content-type') || 'image/png';
      const mimeType = contentType.includes('jpeg') || contentType.includes('jpg') ? 'image/jpeg' : 'image/png';

      processedImages.push({
        image: {
          bytesBase64Encoded: imageBase64,
          mimeType: mimeType,
        },
        referenceType: "asset",
      });
    }

    console.log(`Successfully processed ${processedImages.length} images`);

    console.log("Generating OAuth access token from service account...");
    const accessToken = await getAccessToken(gcpServiceAccountJson);
    console.log("Access token generated, length:", accessToken.length);

    const veoModel = "veo-3.1-fast-generate-preview";
    const location = "us-central1";
    const veoEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${location}/publishers/google/models/${veoModel}:predictLongRunning`;

    let veoAspectRatio = aspectRatio || "9:16";
    if (veoAspectRatio === "1:1") {
      veoAspectRatio = "9:16";
      console.log("Mapping 1:1 aspect ratio to 9:16 (Veo doesn't support square videos)");
    }

    // Veo 3.1 with reference images only supports 8-second videos
    if (processedImages.length > 0 && durationSeconds > 8) {
      console.log(`Warning: Veo 3.1 with reference images only supports 8s videos. Requested ${durationSeconds}s will be clamped to 8s.`);
    }

    const veoRequestBody = {
      instances: [
        {
          prompt: prompt || "Create an engaging product video",
          referenceImages: processedImages,
        },
      ],
      parameters: {
        durationSeconds: durationSeconds,
        aspectRatio: veoAspectRatio,
        personGeneration: "allow_adult",
        generateAudio: false,
      },
    };

    console.log("Calling Veo 3.1 API with prompt:", prompt);
    console.log(`Using ${processedImages.length} reference image(s) with structure:`, JSON.stringify({
      imageCount: processedImages.length,
      mimeTypes: processedImages.map((img: any) => img.image?.mimeType),
      base64Lengths: processedImages.map((img: any) => img.image?.bytesBase64Encoded?.length),
    }));
    console.log("Vertex AI endpoint:", veoEndpoint.replace(gcpProjectId, 'PROJECT_ID'));

    const veoResponse = await fetch(veoEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(veoRequestBody),
    });

    console.log("Veo API response status:", veoResponse.status);

    if (!veoResponse.ok) {
      const errorText = await veoResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      console.error("Veo API error:", errorData);
      await refundCredits(supabase, storeId, creditsRequired, videoId, "Veo API error");
      return new Response(
        JSON.stringify({ error: errorData.error?.message || "Failed to generate video", details: errorData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const veoResult = await veoResponse.json();
    console.log("Veo API response:", veoResult);

    if (veoResult.error) {
      console.error("Veo API returned error:", veoResult.error);
      await refundCredits(supabase, storeId, creditsRequired, videoId, "Veo API error");
      return new Response(
        JSON.stringify({ error: veoResult.error.message || "Video generation failed", details: veoResult.error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const operationName = veoResult.name;
    if (!operationName) {
      console.error("No operation name in response:", veoResult);
      await refundCredits(supabase, storeId, creditsRequired, videoId, "No operation name");
      return new Response(
        JSON.stringify({ error: "No operation name returned from Veo API", details: veoResult }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Updating video record with job ID:", operationName);
    await supabase
      .from("generated_videos")
      .update({
        veo_job_id: operationName,
        veo_model: veoModel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    console.log("Starting background polling...");
    (async () => {
      try {
        await pollVeoJob(
          operationName,
          gcpServiceAccountJson,
          videoId,
          supabase
        );
      } catch (error) {
        console.error("Background polling error:", error);
        await supabase
          .from("generated_videos")
          .update({
            generation_status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", videoId);

        await refundCredits(supabase, storeId, creditsRequired, videoId, "Generation failed");
      }
    })();

    console.log("Returning success response");
    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        message: "Video generation started",
        jobId: operationName,
        creditsRemaining: newCredits,
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
        details: error instanceof Error ? error.stack : undefined,
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

async function refundCredits(
  supabase: any,
  storeId: string,
  amount: number,
  videoId: string,
  reason: string
): Promise<void> {
  console.log(`Refunding ${amount} credits to store ${storeId}: ${reason}`);
  const { data: store } = await supabase
    .from("stores")
    .select("credits_remaining")
    .eq("id", storeId)
    .single();

  if (!store) {
    console.error("Store not found for refund");
    return;
  }

  const newCredits = store.credits_remaining + amount;

  await supabase
    .from("stores")
    .update({
      credits_remaining: newCredits,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  await supabase.from("credit_transactions").insert({
    store_id: storeId,
    video_id: videoId,
    transaction_type: "refund",
    credits_amount: amount,
    credits_before: store.credits_remaining,
    credits_after: newCredits,
    description: `Refund: ${reason}`,
    metadata: {},
  });

  console.log(`Refunded ${amount} credits successfully`);
}

async function chargeUsage(
  supabase: any,
  storeId: string,
  videoId: string,
  durationSeconds: number,
  shopDomain: string,
  accessToken: string
): Promise<void> {
  try {
    console.log("Attempting to charge Shopify usage (separate from credit deduction)...");
    const { data: store } = await supabase
      .from("stores")
      .select("plan_name, shopify_subscription_id")
      .eq("id", storeId)
      .single();

    if (!store || !store.shopify_subscription_id) {
      console.log("No Shopify subscription found - skipping Shopify usage charge (credits already deducted)");
      return;
    }

    const rates: Record<string, number> = {
      free: 0.5,
      basic: 0.3,
      pro: 0.2,
    };

    const rate = rates[store.plan_name] || 0.5;
    const amount = durationSeconds * rate;

    console.log(`Creating usage charge: $${amount.toFixed(2)} for ${durationSeconds}s video`);

    const response = await fetch(
      `https://${shopDomain}/admin/api/2024-01/recurring_application_charges/${store.shopify_subscription_id}/usage_charges.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          usage_charge: {
            description: `${durationSeconds}s video generation`,
            price: amount.toFixed(2),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create usage charge:", errorText);
      return;
    }

    const charge = await response.json();
    console.log("Usage charge created:", charge.usage_charge?.id);

    await supabase.from("usage_charges").insert({
      store_id: storeId,
      video_id: videoId,
      charge_amount: amount,
      charge_description: `${durationSeconds}s video generation`,
      shopify_charge_id: charge.usage_charge?.id,
    });

    console.log("Usage charge recorded in database");
  } catch (error) {
    console.error("Error charging usage:", error);
  }
}

async function pollVeoJob(
  operationName: string,
  serviceAccountJson: string,
  videoId: string,
  supabase: any
): Promise<void> {
  const maxAttempts = 60;
  const pollInterval = 10000;

  console.log(`Starting to poll job: ${operationName}`);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    const accessToken = await getAccessToken(serviceAccountJson);

    const match = operationName.match(/projects\/([^\/]+)\/locations\/([^\/]+)\/publishers\/google\/models\/([^\/]+)/);
    if (!match) {
      console.error('Could not parse operation name:', operationName);
      continue;
    }

    const [, projectId, location, modelId] = match;

    const checkUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
    console.log(`Checking job status (attempt ${attempt + 1}), URL: ${checkUrl}`);

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
      console.error(`Failed to check job status (attempt ${attempt + 1}):`, {
        status: checkResponse.status,
        url: checkUrl,
        error: errorText
      });
      continue;
    }

    const jobStatus = await checkResponse.json();
    console.log(`Job status (attempt ${attempt + 1}):`, jobStatus.metadata?.state || jobStatus.done ? 'done' : 'processing');

    if (jobStatus.done) {
      if (jobStatus.error) {
        console.error("Job completed with error:", jobStatus.error);
        throw new Error(jobStatus.error.message || "Video generation failed");
      }

      const videoBase64 = jobStatus.response?.videos?.[0]?.bytesBase64Encoded;

      if (!videoBase64) {
        console.error("No video data in completed response:", jobStatus);
        throw new Error("No video data in completed response");
      }

      console.log("Fetching video record to get product_id and store info...");
      const { data: videoRecord, error: videoRecordError } = await supabase
        .from("generated_videos")
        .select("product_id, store_id, stores!inner(shop_domain, access_token)")
        .eq("id", videoId)
        .single();

      if (videoRecordError || !videoRecord) {
        console.error("Failed to fetch video record:", videoRecordError);
        throw new Error("Failed to fetch video record");
      }

      const { product_id, stores } = videoRecord as any;
      const { shop_domain, access_token } = stores;

      if (!shop_domain || !access_token) {
        console.error("Missing shop credentials");
        throw new Error("Missing shop credentials");
      }

      console.log("Saving video to Supabase storage...");

      const binaryString = atob(videoBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("generated-videos")
        .upload(`videos/${videoId}.mp4`, bytes, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        console.error("Failed to upload video to storage:", uploadError);
        throw new Error(`Failed to save video: ${uploadError.message}`);
      }

      console.log("Video saved to storage:", uploadData.path);

      // Generate public URL for direct access
      const { data: urlData } = supabase.storage
        .from("generated-videos")
        .getPublicUrl(`videos/${videoId}.mp4`);

      const videoUrl = urlData?.publicUrl || "";

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      console.log("Updating video record with completed data");
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

      console.log("Video generation completed successfully!");

      console.log("Attempting to create Shopify billing charge (optional)...");
      const { data: videoData } = await supabase
        .from("generated_videos")
        .select("duration_seconds, store_id")
        .eq("id", videoId)
        .single();

      if (videoData) {
        await chargeUsage(supabase, videoData.store_id, videoId, videoData.duration_seconds, shop_domain, access_token);
      }

      return;
    }
  }

  throw new Error("Video generation timed out after maximum attempts");
}
