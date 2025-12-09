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
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TikTok Connection</title>
  <style>
    body { margin: 0; padding: 40px; font-family: system-ui, -apple-system, sans-serif; background: #1a1a1a; color: #fff; text-align: center; }
    .container { max-width: 400px; margin: 0 auto; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 20px; margin-bottom: 10px; }
    p { color: #999; }
  </style>
  <script>
    (function() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'tiktok_error', error: '${error.replace(/'/g, "\\'")}' }, '*');
        }
        setTimeout(function() { window.close(); }, 1500);
      } catch(e) {
        setTimeout(function() { window.close(); }, 2000);
      }
    })();
  </script>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>Connection Cancelled</h1>
    <p>Authorization was cancelled.</p>
    <p style="font-size: 12px; margin-top: 20px;">This window will close automatically...</p>
  </div>
</body>
</html>`;
      return new Response(html, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (!code || !state) {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invalid Request</title>
  <style>
    body { margin: 0; padding: 40px; font-family: system-ui, -apple-system, sans-serif; background: #1a1a1a; color: #fff; text-align: center; }
    .container { max-width: 400px; margin: 0 auto; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 20px; margin-bottom: 10px; color: #ef4444; }
    p { color: #999; }
  </style>
  <script>
    (function() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'tiktok_error', error: 'Invalid OAuth parameters' }, '*');
        }
        setTimeout(function() { window.close(); }, 2000);
      } catch(e) {
        setTimeout(function() { window.close(); }, 2500);
      }
    })();
  </script>
</head>
<body>
  <div class="container">
    <div class="icon">⚠️</div>
    <h1>Invalid Request</h1>
    <p>Missing required OAuth parameters.</p>
    <p style="font-size: 12px; margin-top: 20px;">This window will close automatically...</p>
  </div>
</body>
</html>`;
      return new Response(html, {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Decode state to get store_id
    const stateData = JSON.parse(atob(state));
    const storeId = stateData.store_id;

    // Exchange code for access token
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-oauth-callback`;

    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in; // Typically 24 hours
    const openId = tokenData.open_id;

    // Get user info
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await userResponse.json();
    const userInfo = userData.data.user;

    // Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const { error: dbError } = await supabase
      .from('social_media_connections')
      .upsert({
        store_id: storeId,
        platform: 'tiktok',
        platform_user_id: openId,
        platform_username: userInfo.display_name,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt.toISOString(),
        profile_picture_url: userInfo.avatar_url || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'store_id,platform,platform_user_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save connection');
    }

    // Escape username for safe HTML/JS injection
    const safeUsername = userInfo.display_name
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TikTok Connected</title>
  <style>
    body { margin: 0; padding: 40px; font-family: system-ui, -apple-system, sans-serif; background: #1a1a1a; color: #fff; text-align: center; }
    .container { max-width: 400px; margin: 0 auto; }
    .icon { font-size: 48px; margin-bottom: 20px; animation: fadeIn 0.5s; }
    h1 { font-size: 20px; margin-bottom: 10px; color: #10b981; }
    p { color: #999; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
  </style>
  <script>
    // Execute immediately
    (function() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: 'tiktok_connected',
            username: decodeURIComponent('${encodeURIComponent(userInfo.display_name)}')
          }, '*');
        }
        setTimeout(function() {
          window.close();
        }, 2000);
      } catch(e) {
        console.error('Error:', e);
        setTimeout(function() {
          window.close();
        }, 3000);
      }
    })();
  </script>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>TikTok Connected!</h1>
    <p>${safeUsername} connected successfully.</p>
    <p style="font-size: 12px; margin-top: 20px;">This window will close automatically...</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    const errorMsg = error.message.replace(/'/g, "\\'");
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connection Error</title>
  <style>
    body { margin: 0; padding: 40px; font-family: system-ui, -apple-system, sans-serif; background: #1a1a1a; color: #fff; text-align: center; }
    .container { max-width: 400px; margin: 0 auto; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 20px; margin-bottom: 10px; color: #ef4444; }
    p { color: #999; font-size: 14px; }
  </style>
  <script>
    (function() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'tiktok_error', error: '${errorMsg}' }, '*');
        }
        setTimeout(function() { window.close(); }, 2500);
      } catch(e) {
        setTimeout(function() { window.close(); }, 3000);
      }
    })();
  </script>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>Connection Error</h1>
    <p>${error.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    <p style="font-size: 12px; margin-top: 20px;">This window will close automatically...</p>
  </div>
</body>
</html>`;
    return new Response(html, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
});