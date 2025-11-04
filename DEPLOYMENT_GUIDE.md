# ProMotionAI - Complete Deployment Guide

This guide provides step-by-step instructions to deploy ProMotionAI to production.

## Prerequisites

1. Shopify Partner account with ProMotionAI app created
2. Supabase account with project set up
3. Netlify account for frontend hosting

## Part 1: Database Setup

### 1.1 Verify Database Tables
The following tables should already exist from migrations:
- `stores` - Shopify store information and access tokens
- `generated_videos` - Generated video records
- `credit_transactions` - Credit usage tracking
- `subscription_plans` - Available subscription plans

### 1.2 Verify Row Level Security (RLS)
All tables must have RLS enabled with appropriate policies.

## Part 2: Supabase Edge Functions Configuration

### 2.1 Get Your Shopify API Secret
1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Navigate to Apps > ProMotionAI
3. Click "Client credentials"
4. Copy the "Client secret" value

### 2.2 Configure Edge Function Secrets
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/zbiuevrxbupsvmpfuqpq/settings/functions)
2. Click "Edge Functions" in the sidebar
3. Click "Secrets" tab
4. Add these secrets:

```
SHOPIFY_API_KEY=a72a38e2a6289f2b8b802a980e67e810
SHOPIFY_API_SECRET=[paste your Shopify client secret here]
FRONTEND_URL=https://aesthetic-cucurucho-6aab1c.netlify.app
```

**IMPORTANT:** Do NOT include quotes around the values.

### 2.3 Verify Edge Functions Are Deployed
The following functions should be deployed:
- `shopify-oauth-init` - Initiates OAuth flow
- `shopify-oauth-callback` - Handles OAuth callback
- `generate-video` - Handles video generation requests

You can verify by going to: https://supabase.com/dashboard/project/zbiuevrxbupsvmpfuqpq/functions

## Part 3: Shopify App Configuration

### 3.1 Configure App URLs
1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Navigate to Apps > ProMotionAI > Configuration
3. Set the following URLs:

**App URL:**
```
https://aesthetic-cucurucho-6aab1c.netlify.app
```

**Allowed redirection URL(s):** (Click "Add URL" and enter)
```
https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-oauth-callback
```

### 3.2 Verify API Scopes
Ensure your app has these scopes enabled:
- `read_analytics`
- `read_inventory`
- `read_orders`
- `read_product_listings`
- `read_products`
- `write_products`
- `read_content`
- `write_content`

### 3.3 Enable Embedded App
Make sure "Embedded app" is enabled in the app settings.

## Part 4: Netlify Deployment

### 4.1 Configure Environment Variables
1. Go to your [Netlify Dashboard](https://app.netlify.com)
2. Select your site (aesthetic-cucurucho-6aab1c)
3. Go to Site Settings > Environment Variables
4. Click "Add a variable" and add the following:

**Variable 1:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://zbiuevrxbupsvmpfuqpq.supabase.co`

**Variable 2:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: (Get from [Supabase Dashboard](https://supabase.com/dashboard/project/zbiuevrxbupsvmpfuqpq/settings/api) under "Project API keys" > "anon public")

**CRITICAL:** Copy the anon key EXACTLY as shown, including all characters.

### 4.2 Deploy to Netlify
1. Push your code to your Git repository
2. Netlify will automatically deploy
3. Or manually trigger a deploy from Netlify Dashboard

### 4.3 Verify Deployment
1. Visit: `https://aesthetic-cucurucho-6aab1c.netlify.app`
2. You should see the "Connect to Shopify" page
3. Check browser console for any errors

## Part 5: Testing

### 5.1 Test Embedded App Installation
1. Go to your Shopify Partner Dashboard
2. Click "Test your app" next to ProMotionAI
3. Select a development store
4. The app should:
   - Open in an embedded iframe
   - Redirect to Shopify OAuth page
   - Complete OAuth and redirect back
   - Load the dashboard with your products

### 5.2 Common Issues and Solutions

**Issue:** "Supabase configuration missing" error
**Solution:**
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Netlify
- Trigger a new deploy after adding environment variables

**Issue:** "accounts.shopify.com refused to connect"
**Solution:**
- Verify CSP headers in `netlify.toml` and `public/_headers`
- Check that App URL matches your Netlify URL exactly

**Issue:** OAuth callback fails or redirects to wrong URL
**Solution:**
- Verify FRONTEND_URL secret in Supabase Edge Functions
- Check that callback URL is added to Shopify app settings
- Ensure callback URL is EXACTLY: `https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-oauth-callback`

**Issue:** App loads but no products appear
**Solution:**
- Check that Shopify API scopes are correctly configured
- Verify the store has products with images
- Check browser console and Supabase Edge Function logs for errors

## Part 6: Post-Deployment Verification

### 6.1 Verify Database Connection
Check Supabase Dashboard > Table Editor > stores
- A new row should appear after OAuth completion

### 6.2 Verify Edge Function Logs
Go to Supabase Dashboard > Edge Functions > shopify-oauth-callback > Invocations
- Should show successful 200 responses
- Check for any error messages

### 6.3 Test Complete Flow
1. Install app on test store
2. View products
3. Generate a video (if credits available)
4. Check video library
5. Verify credit deduction

## Environment Variables Reference

### Netlify (Frontend)
```
VITE_SUPABASE_URL=https://zbiuevrxbupsvmpfuqpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase Edge Functions (Backend)
```
SHOPIFY_API_KEY=a72a38e2a6289f2b8b802a980e67e810
SHOPIFY_API_SECRET=[your-secret-here]
FRONTEND_URL=https://aesthetic-cucurucho-6aab1c.netlify.app
```

### Shopify App Configuration
```
App URL: https://aesthetic-cucurucho-6aab1c.netlify.app
OAuth Redirect: https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-oauth-callback
```

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Check Supabase Edge Function logs
3. Verify all environment variables are set correctly
4. Ensure all URLs match exactly (no trailing slashes)
