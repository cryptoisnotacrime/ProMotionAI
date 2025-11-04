import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AddVideoRequest {
  videoId: string;
  storeId: string;
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

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: AddVideoRequest = await req.json();
    const { videoId, storeId } = body;

    console.log("Fetching video and store info...");
    const { data: video, error: videoError } = await supabase
      .from("generated_videos")
      .select("*, stores!inner(shop_domain, access_token)")
      .eq("id", videoId)
      .eq("store_id", storeId)
      .single();

    if (videoError || !video) {
      console.error("Video not found:", videoError);
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (video.attached_to_product) {
      return new Response(
        JSON.stringify({ error: "Video already published to product" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { shop_domain, access_token } = (video as any).stores;

    console.log("Downloading video from Supabase storage...");
    const { data: videoData, error: downloadError } = await supabase.storage
      .from("generated-videos")
      .download(`videos/${videoId}.mp4`);

    if (downloadError || !videoData) {
      console.error("Failed to download video:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download video from storage" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Converting video to base64...");
    const arrayBuffer = await videoData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const videoBase64 = btoa(binaryString);

    console.log("Uploading to Shopify and attaching to product...");
    const { videoUrl, mediaId } = await uploadVideoToShopify(
      videoBase64,
      (video as any).product_id,
      shop_domain,
      access_token,
      videoId
    );

    console.log("Deleting video from Supabase Storage to save space...");
    const { error: deleteError } = await supabase.storage
      .from("generated-videos")
      .remove([`videos/${videoId}.mp4`]);

    if (deleteError) {
      console.error("Failed to delete video from storage:", deleteError);
    } else {
      console.log("Video deleted from storage successfully");
    }

    console.log("Updating video record...");
    await supabase
      .from("generated_videos")
      .update({
        attached_to_product: true,
        shopify_media_id: mediaId,
        video_url: videoUrl,
        video_downloaded: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    return new Response(
      JSON.stringify({
        success: true,
        videoUrl,
        mediaId,
        message: "Video successfully published to product page"
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

async function uploadVideoToShopify(
  videoBase64: string,
  productId: string,
  shopDomain: string,
  accessToken: string,
  videoId: string
): Promise<{ videoUrl: string; mediaId: string }> {
  const binaryString = atob(videoBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const graphqlEndpoint = `https://${shopDomain}/admin/api/2024-10/graphql.json`;

  const stagedUploadQuery = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          resourceUrl
          url
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  console.log("Creating staged upload for VIDEO resource with POST method...");
  const stagedUploadResponse = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      query: stagedUploadQuery,
      variables: {
        input: [
          {
            filename: `${videoId}.mp4`,
            mimeType: "video/mp4",
            resource: "VIDEO",
            fileSize: bytes.length.toString(),
            httpMethod: "POST",
          },
        ],
      },
    }),
  });

  if (!stagedUploadResponse.ok) {
    const errorText = await stagedUploadResponse.text();
    console.error("Failed to create staged upload:", errorText);
    throw new Error(`Failed to create staged upload: ${errorText}`);
  }

  const stagedUploadData = await stagedUploadResponse.json();
  console.log("Staged upload response:", JSON.stringify(stagedUploadData));

  if (stagedUploadData.errors || stagedUploadData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
    const errors = stagedUploadData.errors || stagedUploadData.data.stagedUploadsCreate.userErrors;
    console.error("Staged upload errors:", errors);
    throw new Error(`Staged upload failed: ${JSON.stringify(errors)}`);
  }

  const stagedTarget = stagedUploadData.data.stagedUploadsCreate.stagedTargets[0];
  const { url: uploadUrl, parameters, resourceUrl } = stagedTarget;

  console.log("===== UPLOAD DEBUG INFO =====");
  console.log("Upload URL:", uploadUrl);
  console.log("Parameters:", JSON.stringify(parameters, null, 2));
  console.log("ResourceURL:", resourceUrl);
  console.log("File size:", bytes.length, "bytes");

  const formData = new FormData();

  for (const param of parameters) {
    formData.append(param.name, param.value);
    console.log(`Added form field: ${param.name}`);
  }

  const videoBlob = new Blob([bytes]);
  formData.append("file", videoBlob, `${videoId}.mp4`);
  console.log("Added file field");

  console.log("Making POST request...");
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("Failed to upload video to staged URL:", errorText);
    throw new Error(`Failed to upload video: ${errorText}`);
  }

  console.log("Video uploaded to staged URL successfully");

  const createMediaQuery = `
    mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
      productCreateMedia(media: $media, productId: $productId) {
        media {
          ... on Video {
            id
            sources {
              url
            }
          }
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `;

  console.log("Attaching video to product...");
  const createMediaResponse = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      query: createMediaQuery,
      variables: {
        productId: `gid://shopify/Product/${productId}`,
        media: [
          {
            originalSource: resourceUrl,
            mediaContentType: "VIDEO",
          },
        ],
      },
    }),
  });

  if (!createMediaResponse.ok) {
    const errorText = await createMediaResponse.text();
    console.error("Failed to create product media:", errorText);
    throw new Error(`Failed to create product media: ${errorText}`);
  }

  const createMediaData = await createMediaResponse.json();
  console.log("Create media response:", JSON.stringify(createMediaData));

  if (createMediaData.errors || createMediaData.data?.productCreateMedia?.mediaUserErrors?.length > 0) {
    const errors = createMediaData.errors || createMediaData.data.productCreateMedia.mediaUserErrors;
    console.error("Create media errors:", errors);
    throw new Error(`Failed to attach video to product: ${JSON.stringify(errors)}`);
  }

  const videoMedia = createMediaData.data.productCreateMedia.media[0];
  const videoGid = videoMedia?.id;

  if (!videoGid) {
    console.error("No video ID in response:", createMediaData);
    throw new Error("No video ID returned from Shopify");
  }

  console.log("Video attached to product with ID:", videoGid);

  const videoUrl = await pollShopifyVideoSources(
    videoGid,
    shopDomain,
    accessToken,
    graphqlEndpoint
  );

  return { videoUrl, mediaId: videoGid };
}

async function pollShopifyVideoSources(
  videoGid: string,
  shopDomain: string,
  accessToken: string,
  graphqlEndpoint: string
): Promise<string> {
  const maxAttempts = 30;
  const pollInterval = 2000;

  const queryVideoSources = `
    query getVideo($id: ID!) {
      node(id: $id) {
        ... on Video {
          sources {
            url
          }
        }
      }
    }
  `;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    console.log(`Polling video sources (attempt ${attempt + 1}/${maxAttempts})...`);

    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: queryVideoSources,
        variables: {
          id: videoGid,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const video = data.data?.node;

      if (video?.sources && video.sources.length > 0) {
        const url = video.sources[0].url;
        console.log("Video URL ready:", url);
        return url;
      }
    }
  }

  throw new Error("Timeout waiting for Shopify to process video");
}
