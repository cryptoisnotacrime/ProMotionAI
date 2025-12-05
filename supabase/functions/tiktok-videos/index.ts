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
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'store_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get TikTok connection from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { data: connection, error: dbError } = await supabase
      .from('social_media_connections')
      .select('*')
      .eq('store_id', storeId)
      .eq('platform', 'tiktok')
      .eq('is_active', true)
      .single();

    if (dbError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No TikTok connection found. Please connect your TikTok account first.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(connection.token_expires_at);
    if (expiresAt < new Date()) {
      // TODO: Implement token refresh
      return new Response(
        JSON.stringify({ error: 'TikTok token expired. Please reconnect your account.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch videos from TikTok
    const videosResponse = await fetch(
      `https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,title,video_description,duration,height,width`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_count: limit,
      }),
    });

    if (!videosResponse.ok) {
      const errorText = await videosResponse.text();
      console.error('TikTok API error:', errorText);
      throw new Error('Failed to fetch TikTok videos');
    }

    const videosData = await videosResponse.json();

    // Format videos for our app (we'll use cover images)
    const media = (videosData.data?.videos || []).map((video: any) => ({
      id: video.id,
      url: video.cover_image_url,
      thumbnail: video.cover_image_url,
      caption: video.title || video.video_description || '',
      timestamp: video.create_time,
      type: 'VIDEO_THUMBNAIL',
      duration: video.duration,
    }));

    return new Response(
      JSON.stringify({
        media,
        username: connection.platform_username,
        hasMore: videosData.data?.has_more || false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('TikTok videos fetch error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch TikTok videos' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});