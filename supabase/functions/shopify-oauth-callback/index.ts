import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!shop || !code) {
      return new Response(
        JSON.stringify({ error: "Missing shop or code parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let host = null;
    if (state) {
      try {
        const decodedState = JSON.parse(atob(state));
        host = decodedState.host;
      } catch (e) {
        console.log("Failed to decode state:", e);
      }
    }

    const apiKey = Deno.env.get("SHOPIFY_API_KEY");
    const apiSecret = Deno.env.get("SHOPIFY_API_SECRET");

    if (!apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "Shopify credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      return new Response(
        JSON.stringify({ error: "Failed to exchange token", details: error }),
        {
          status: tokenResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!shopResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch shop info" }),
        {
          status: shopResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: store, error: dbError } = await supabase
      .from("stores")
      .upsert({
        shop_domain: shop,
        access_token: accessToken,
        shopify_store_id: shopInfo.id.toString(),
        store_name: shopInfo.name,
        email: shopInfo.email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'shop_domain'
      })
      .select()
      .single();

    if (dbError) {
      return new Response(
        JSON.stringify({ error: "Failed to save store", details: dbError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For embedded apps, redirect back to Shopify admin which will load our app in an iframe
    if (host) {
      // Redirect to Shopify admin which will then load our app embedded
      const redirectUrl = `https://${shop}/admin/apps/promotionai?installed=true`;

      return new Response(null, {
        status: 303,
        headers: {
          "Location": redirectUrl,
        },
      });
    }

    // For non-embedded, redirect directly to our app
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://aesthetic-cucurucho-6aab1c.netlify.app";
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set("shop", shop);
    redirectUrl.searchParams.set("installed", "true");

    return new Response(null, {
      status: 303,
      headers: {
        "Location": redirectUrl.toString(),
      },
    });
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
