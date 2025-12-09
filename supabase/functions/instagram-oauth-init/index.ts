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
    const storeId = url.searchParams.get('store_id');

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'store_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const clientId = Deno.env.get('FACEBOOK_APP_ID');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/instagram-oauth-callback`;

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Facebook OAuth not configured. Please set FACEBOOK_APP_ID in Supabase secrets.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build Facebook OAuth URL with Instagram permissions
    const scope = 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,instagram_content_publish,business_management';
    const state = btoa(JSON.stringify({ store_id: storeId, timestamp: Date.now() }));

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=${state}`;

    return new Response(
      JSON.stringify({ authUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Instagram OAuth init error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to initialize Instagram OAuth' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});