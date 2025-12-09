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
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'instagram_error', error: '${error}' }, '*'); window.close();</script><p>Authorization cancelled. You can close this window.</p></body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    if (!code || !state) {
      return new Response(
        `<html><body><p>Invalid OAuth callback. Missing code or state.</p></body></html>`,
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    const stateData = JSON.parse(atob(state));
    const storeId = stateData.store_id;

    const clientId = Deno.env.get('FACEBOOK_APP_ID');
    const clientSecret = Deno.env.get('FACEBOOK_APP_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/instagram-oauth-callback`;

    // Step 1: Exchange code for Facebook access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Get long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${clientId}&` +
      `client_secret=${clientSecret}&` +
      `fb_exchange_token=${accessToken}`
    );

    const longLivedData = await longLivedResponse.json();
    const longLivedToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in || 5184000;

    // Step 3: Get Facebook User ID
    const meResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${longLivedToken}`
    );
    const meData = await meResponse.json();
    const facebookUserId = meData.id;

    // Step 4: Get Facebook Pages connected to this user
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/${facebookUserId}/accounts?` +
      `fields=id,name,access_token&` +
      `access_token=${longLivedToken}`
    );

    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'instagram_error', error: 'No Facebook Pages found. You need a Facebook Page connected to your Instagram Business Account.' }, '*'); window.close();</script><p>No Facebook Pages found. Please create a Facebook Page and link your Instagram Business Account to it.</p></body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    // Step 5: For each page, check if it has an Instagram Business Account
    let instagramAccountFound = false;
    let connectionData: any = null;

    for (const page of pagesData.data) {
      try {
        const igAccountResponse = await fetch(
          `https://graph.facebook.com/v21.0/${page.id}?` +
          `fields=instagram_business_account&` +
          `access_token=${page.access_token}`
        );

        const igAccountData = await igAccountResponse.json();

        if (igAccountData.instagram_business_account) {
          const igBusinessAccountId = igAccountData.instagram_business_account.id;

          // Get Instagram account details
          const igProfileResponse = await fetch(
            `https://graph.facebook.com/v21.0/${igBusinessAccountId}?` +
            `fields=id,username,profile_picture_url,followers_count,media_count&` +
            `access_token=${page.access_token}`
          );

          const igProfile = await igProfileResponse.json();

          connectionData = {
            store_id: storeId,
            platform: 'instagram',
            platform_user_id: igBusinessAccountId,
            platform_username: igProfile.username,
            access_token: page.access_token,
            token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
            profile_picture_url: igProfile.profile_picture_url || null,
            facebook_page_id: page.id,
            instagram_business_account_id: igBusinessAccountId,
            facebook_user_id: facebookUserId,
            account_type: 'business',
            is_active: true,
            updated_at: new Date().toISOString(),
          };

          instagramAccountFound = true;
          break;
        }
      } catch (error) {
        console.error(`Error checking page ${page.id}:`, error);
        continue;
      }
    }

    if (!instagramAccountFound) {
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'instagram_error', error: 'No Instagram Business Account found linked to your Facebook Pages.' }, '*'); window.close();</script><p>No Instagram Business Account found. Please link your Instagram Business Account to one of your Facebook Pages.</p></body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        }
      );
    }

    // Step 6: Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { error: dbError } = await supabase
      .from('social_media_connections')
      .upsert(connectionData, {
        onConflict: 'store_id,platform,platform_user_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save connection');
    }

    return new Response(
      `<html><body><script>window.opener?.postMessage({ type: 'instagram_connected', username: '${connectionData.platform_username}' }, '*'); window.close();</script><p>Instagram Business Account connected successfully! You can close this window.</p></body></html>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return new Response(
      `<html><body><p>Error connecting Instagram: ${error.message}</p></body></html>`,
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      }
    );
  }
});