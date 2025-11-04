# Shopify OAuth Flow - Fixed

## The Problem
The app wasn't loading after clicking in Shopify because:
1. The frontend was trying to use `VITE_SHOPIFY_API_KEY` which we removed for security
2. OAuth redirects weren't configured properly for embedded apps
3. Headers and CORS issues with 200s becoming 303s

## The Solution

### OAuth Flow (Embedded Apps)

1. **User clicks app in Shopify admin**
   - URL: `https://your-app.netlify.app?shop=store.myshopify.com&host=xxx&embedded=1`

2. **App checks if store is authenticated**
   - If YES: Load the app normally
   - If NO: Show "Connect Your Store" page

3. **User clicks "Connect to Shopify"**
   - Frontend calls Edge Function: `/functions/v1/shopify-oauth-init?shop=store.myshopify.com`
   - Edge Function builds OAuth URL with API key (kept secret on backend)
   - Returns OAuth URL to frontend

4. **Frontend redirects to Shopify OAuth page**
   - User approves permissions

5. **Shopify redirects back to OAuth callback**
   - URL: `/functions/v1/shopify-oauth-callback?shop=xxx&code=xxx&host=xxx`
   - Edge Function exchanges code for access token
   - Saves store info to database
   - **Redirects to frontend with apiKey in URL**: `?shop=xxx&host=xxx&embedded=1&apiKey=xxx`

6. **Frontend loads with Shopify App Bridge**
   - Reads `apiKey` from URL params
   - Initializes App Bridge with the API key
   - App is now loaded in Shopify admin iframe

## Security Model

- **Shopify API Secret**: NEVER exposed (backend only)
- **Shopify API Key**: Passed via URL params ONLY after successful OAuth
  - This is safe because Shopify API keys are meant to be public (client IDs)
  - They're only useful with the secret, which stays on backend
- **Access Tokens**: Stored in database, never exposed to frontend

## Key Files

- `supabase/functions/shopify-oauth-init/index.ts` - Builds OAuth URL
- `supabase/functions/shopify-oauth-callback/index.ts` - Handles OAuth callback
- `src/components/auth/ShopifyAppBridge.tsx` - Initializes App Bridge with API key
- `src/config/shopify.ts` - Initiates OAuth flow

## Environment Variables Required

### Netlify (Frontend)
- `VITE_Bolt_Database_URL`
- `VITE_Bolt_Database_ANON_KEY`

### Supabase Edge Functions (Backend)
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `FRONTEND_URL`

## HTTP Status Codes

- **303 See Other**: Used by OAuth callback to redirect after processing
- **401 Unauthorized**: Means Supabase auth headers are missing
- **200 OK**: Successful Edge Function response

## Troubleshooting

- **401 Errors**: Check that `Authorization` and `apikey` headers are being sent
- **App not loading**: Check browser console for App Bridge errors
- **CORS errors**: Verify Edge Functions have proper CORS headers
- **Redirect loops**: Check that store is being saved to database properly
