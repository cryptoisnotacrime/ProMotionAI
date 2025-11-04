import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Shopify-Topic, X-Shopify-Hmac-Sha256, X-Shopify-Shop-Domain",
};

async function verifyWebhook(body: string, hmac: string): Promise<boolean> {
  try {
    const secret = Deno.env.get("SHOPIFY_API_SECRET");
    if (!secret) {
      console.error("SHOPIFY_API_SECRET not configured");
      return false;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const digest = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    return digest === hmac;
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const topic = req.headers.get("X-Shopify-Topic");
    const hmac = req.headers.get("X-Shopify-Hmac-Sha256");
    const shopDomain = req.headers.get("X-Shopify-Shop-Domain");
    const body = await req.text();
    
    console.log(`Webhook received: ${topic} from ${shopDomain}`);

    // Verify webhook signature
    if (!hmac || !await verifyWebhook(body, hmac)) {
      console.error("Webhook verification failed");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const data = JSON.parse(body);
    const shop = shopDomain || data.domain || data.shop_domain;

    if (!shop) {
      console.error("Unable to determine shop domain");
      return new Response("Bad Request: Missing shop domain", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get store ID
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shop)
      .maybeSingle();

    if (!store) {
      console.error(`Store not found: ${shop}`);
      return new Response("Store not found", { status: 404, headers: corsHeaders });
    }

    switch(topic) {
      case "app/uninstalled":
        console.log(`Processing app uninstall for ${shop}`);
        await supabase.from('stores')
          .update({ 
            subscription_status: 'cancelled',
            access_token: null,
            updated_at: new Date().toISOString()
          })
          .eq('shop_domain', shop);
        console.log(`App uninstalled successfully for ${shop}`);
        break;

      case "customers/data_request":
        console.log(`Processing GDPR data request for ${shop}`);
        // Return customer data (GDPR compliance)
        const { data: videos } = await supabase
          .from('generated_videos')
          .select('*')
          .eq('store_id', store.id);
        
        const { data: transactions } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('store_id', store.id);

        const { data: storeData } = await supabase
          .from('stores')
          .select('shop_domain, store_name, email, subscription_status, credits_available')
          .eq('id', store.id)
          .maybeSingle();
        
        return new Response(JSON.stringify({ 
          store: storeData,
          videos,
          transactions 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case "customers/redact":
        console.log(`Processing GDPR customer redaction for ${shop}`);
        // Delete customer-specific data (GDPR)
        await supabase
          .from('generated_videos')
          .delete()
          .eq('store_id', store.id);
        
        await supabase
          .from('credit_transactions')
          .delete()
          .eq('store_id', store.id);
        
        console.log(`Customer data redacted for ${shop}`);
        break;

      case "shop/redact":
        console.log(`Processing GDPR shop redaction for ${shop}`);
        // Delete all store data after 48h (GDPR)
        // First delete related data
        await supabase.from('generated_videos').delete().eq('store_id', store.id);
        await supabase.from('credit_transactions').delete().eq('store_id', store.id);
        await supabase.from('store_video_preferences').delete().eq('store_id', store.id);
        await supabase.from('store_business_dna').delete().eq('store_id', store.id);
        
        // Then delete the store
        await supabase.from('stores').delete().eq('shop_domain', shop);
        console.log(`Shop data completely redacted for ${shop}`);
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal Server Error", { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
