# ProMotionAI - Shopify Integration Setup Guide

## Step 1: Get Your Deployed App URL

Your app is currently deployed on Bolt.new. The URL is visible in your browser's address bar and will look like:
```
https://bolt-xxxxx.bolt.new
```

**Copy this URL** - you'll need it for the Shopify setup.

## Step 2: Create a Shopify Partner Account

1. Go to https://partners.shopify.com/signup
2. Sign up for a free Partner account
3. Once logged in, create a **Development Store** from the dashboard

## Step 3: Create Your Shopify App

1. In your Partner Dashboard, go to **Apps** → **Create app**
2. Choose **Create app manually**
3. Enter app details:
   - **App name**: ProMotionAI
   - **App URL**: `YOUR_BOLT_URL` (from Step 1)
   - **Allowed redirection URL(s)**: `YOUR_SUPABASE_URL/functions/v1/shopify-oauth-callback`

**CRITICAL**: The redirect URL MUST be the Supabase Edge Function URL shown above!

## Step 4: Configure OAuth Scopes

In your app settings, request these access scopes:
- `read_products` - To fetch product data
- `read_content` - To access store content
- `write_content` - To embed generated videos

## Step 5: Get Your API Credentials

1. In your app's dashboard, go to **API credentials**
2. Copy these values:
   - **Client ID** (API key)
   - **Client secret** (API secret key)

## Step 6: Configure Environment Variables

### A. Netlify Environment Variables (Frontend)

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add these variables (use underscores, no spaces in the names):
   - `VITE_Bolt_Database_URL`: Your Supabase project URL
   - `VITE_Bolt_Database_ANON_KEY`: Your Supabase anon/public key

### B. Supabase Edge Function Secrets (Backend)

**IMPORTANT**: Shopify credentials must be stored server-side only, never in the frontend:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** → **Settings** → **Secrets**
4. Add these secrets:
   - `SHOPIFY_API_KEY`: your_client_id_here
   - `SHOPIFY_API_SECRET`: your_client_secret_here

The OAuth flow now happens through a secure Edge Function that keeps your API keys server-side.

## Step 7: Install the App on Your Development Store

1. In Partner Dashboard, go to your app
2. Click **Test your app** → Select your development store
3. Click **Install app**
4. Authorize the app with the requested permissions

## Step 8: Test the Integration

Once installed, your app should:
- ✅ Connect to your Shopify store
- ✅ Display your products
- ✅ Allow you to select product images
- ✅ Generate videos using AI
- ✅ Track credits and usage

## Important URLs for Shopify Setup

When configuring your Shopify app, use these URLs:

| Setting | URL |
|---------|-----|
| App URL | `YOUR_BOLT_URL` (your browser URL) |
| Allowed redirection URL | `YOUR_SUPABASE_URL/functions/v1/shopify-oauth-callback` |
| GDPR webhooks (optional) | `YOUR_BOLT_URL/webhooks/gdpr` |

**CRITICAL**: The OAuth redirect URL must point to the Supabase Edge Function, not your Bolt.new URL!

## Troubleshooting

### App won't connect
- Verify your API credentials are correct in `.env`
- Check that the redirect URL matches exactly
- Ensure all required scopes are enabled

### Products not loading
- Verify `read_products` scope is enabled
- Check that your development store has products
- Review browser console for errors

### Need Help?
- Shopify Partner docs: https://shopify.dev/docs/apps
- OAuth documentation: https://shopify.dev/docs/apps/auth/oauth

## Next Steps After Setup

1. Generate test videos with your product images
2. Review credit usage and billing
3. Customize video prompts for your products
4. Explore different subscription plans
