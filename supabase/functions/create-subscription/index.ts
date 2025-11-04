import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const { shop, planName } = await req.json();

    console.log("Create subscription request:", { shop, planName });

    if (!shop || !planName) {
      console.error("Missing required parameters:", { shop, planName });
      return new Response(
        JSON.stringify({ error: "Missing shop or planName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip subscription creation for free plan
    if (planName === 'free') {
      console.log("Free plan selected - updating store without Shopify charge");
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from("stores")
        .update({
          plan_name: 'free',
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq("shop_domain", shop);

      if (updateError) {
        console.error("Failed to update store:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update plan" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Switched to free plan" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prices: Record<string, number> = {
      free: 0,
      basic: 19.99,
      pro: 49.99,
    };

    const usageRates: Record<string, number> = {
      free: 0.5,
      basic: 0.3,
      pro: 0.2,
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("access_token, id, plan_name")
      .eq("shop_domain", shop)
      .maybeSingle();

    if (storeError) {
      console.error("Database error fetching store:", storeError);
      return new Response(
        JSON.stringify({ error: "Database error: " + storeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!store) {
      console.error("Store not found:", shop);
      return new Response(
        JSON.stringify({ error: "Store not found. Please reinstall the app." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!store.access_token) {
      console.error("Store has no access token:", shop);
      return new Response(
        JSON.stringify({ error: "Store authentication invalid. Please reinstall the app." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://aesthetic-cucuracho-6aabic.netlify.app";
    console.log("Using frontend URL:", frontendUrl);

    const mutation = `
      mutation CreateSubscription($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!) {
        appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems) {
          confirmationUrl
          appSubscription {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      name: `ProMotionAI ${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
      returnUrl: `${frontendUrl}?shop=${shop}`,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: prices[planName], currencyCode: "USD" },
              interval: "EVERY_30_DAYS",
            },
          },
        },
        {
          plan: {
            appUsagePricingDetails: {
              cappedAmount: { amount: 100, currencyCode: "USD" },
              terms: `$${usageRates[planName]} per video`,
            },
          },
        },
      ],
    };

    console.log("Creating Shopify subscription with variables:", {
      name: variables.name,
      returnUrl: variables.returnUrl,
      shop,
    });

    // First, update the store to track the intended plan
    await supabase
      .from("stores")
      .update({
        plan_name: planName,
        updated_at: new Date().toISOString(),
      })
      .eq("shop_domain", shop);

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": store.access_token,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (!response.ok) {
      console.error("Shopify API HTTP error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return new Response(
        JSON.stringify({ error: `Shopify API error: ${response.status} ${response.statusText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("Shopify API response:", JSON.stringify(result, null, 2));

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return new Response(
        JSON.stringify({ error: "GraphQL error: " + JSON.stringify(result.errors) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (result.data?.appSubscriptionCreate?.userErrors?.length > 0) {
      console.error("User errors:", result.data.appSubscriptionCreate.userErrors);
      const errorMessages = result.data.appSubscriptionCreate.userErrors
        .map((e: any) => e.message)
        .join(", ");
      return new Response(
        JSON.stringify({ error: errorMessages }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!result.data?.appSubscriptionCreate?.confirmationUrl) {
      console.error("No confirmation URL in response:", result);
      return new Response(
        JSON.stringify({ error: "No confirmation URL received from Shopify" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Subscription created successfully, confirmation URL:", result.data.appSubscriptionCreate.confirmationUrl);

    return new Response(
      JSON.stringify(result.data.appSubscriptionCreate),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});