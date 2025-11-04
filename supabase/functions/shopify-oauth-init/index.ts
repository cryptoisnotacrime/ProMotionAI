import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return new Response(
        JSON.stringify({ error: "Missing shop parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("SHOPIFY_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!apiKey || !supabaseUrl) {
      console.error('Missing configuration:', { 
        hasApiKey: !!apiKey, 
        hasSupabaseUrl: !!supabaseUrl 
      });
      return new Response(
        JSON.stringify({ error: "Configuration error: Missing SHOPIFY_API_KEY or SUPABASE_URL" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const scopes = [
      "read_analytics",
      "read_inventory",
      "read_orders",
      "read_product_listings",
      "read_products",
      "write_products",
      "read_content",
      "write_content",
      "write_files",
    ].join(",");

    const redirectUri = `${supabaseUrl}/functions/v1/shopify-oauth-callback`;

    // Get host parameter if present (for embedded apps)
    const host = url.searchParams.get("host");
    const stateData = host ? { host } : {};
    const state = btoa(JSON.stringify(stateData));

    const authParams = new URLSearchParams({
      client_id: apiKey,
      scope: scopes,
      redirect_uri: redirectUri,
      state: state,
      'grant_options[]': 'per-user',
    });

    const authUrl = `https://${shop}/admin/oauth/authorize?${authParams.toString()}`;

    console.log('Generated OAuth URL for shop:', shop);

    return new Response(
      JSON.stringify({ authUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
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