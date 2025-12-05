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

    // TikTok OAuth configuration
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-oauth-callback`;

    if (!clientKey) {
      return new Response(
        JSON.stringify({ error: 'TikTok OAuth not configured. Please set TIKTOK_CLIENT_KEY in Supabase secrets.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate CSRF token
    const csrfState = btoa(JSON.stringify({ store_id: storeId, timestamp: Date.now() }));
    
    // TikTok requires specific scopes
    const scope = 'user.info.basic,video.list';
    
    // Build TikTok OAuth URL
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?` +
      `client_key=${clientKey}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${csrfState}`;

    return new Response(
      JSON.stringify({ authUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('TikTok OAuth init error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to initialize TikTok OAuth' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});