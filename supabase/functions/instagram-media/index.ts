import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

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
    const limit = parseInt(url.searchParams.get('limit') || '25');

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'store_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Instagram connection from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { data: connection, error: dbError } = await supabase
      .from('social_media_connections')
      .select('*')
      .eq('store_id', storeId)
      .eq('platform', 'instagram')
      .eq('is_active', true)
      .single();

    if (dbError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No Instagram connection found. Please connect your Instagram account first.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(connection.token_expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Instagram token expired. Please reconnect your account.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Use Instagram Business Account ID to fetch media
    const igBusinessAccountId = connection.instagram_business_account_id;

    if (!igBusinessAccountId) {
      return new Response(
        JSON.stringify({ error: 'Instagram Business Account not properly configured. Please reconnect your account.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch media from Instagram Graph API
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igBusinessAccountId}/media?` +
      `fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&` +
      `limit=${limit}&` +
      `access_token=${connection.access_token}`
    );

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.json();
      console.error('Instagram API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to fetch Instagram media');
    }

    const mediaData = await mediaResponse.json();

    // Filter for images only (or videos with thumbnails)
    const media = mediaData.data
      .filter((item: any) => item.media_type === 'IMAGE' || item.media_type === 'CAROUSEL_ALBUM')
      .map((item: any) => ({
        id: item.id,
        url: item.media_url,
        thumbnail: item.thumbnail_url || item.media_url,
        caption: item.caption || '',
        permalink: item.permalink,
        timestamp: item.timestamp,
        type: item.media_type,
      }));

    return new Response(
      JSON.stringify({
        media,
        username: connection.platform_username,
        hasMore: !!mediaData.paging?.next,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Instagram media fetch error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch Instagram media' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});