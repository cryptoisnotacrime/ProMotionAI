# Pre-Deployment Checklist for ProMotionAI

Use this checklist to ensure everything is configured correctly before deploying to production.

## ✅ Supabase Configuration

### Edge Function Secrets
Go to: https://supabase.com/dashboard/project/zbiuevrxbupsvmpfuqpq/settings/functions

Verify these secrets are set (click "Secrets" tab):

- [ ] `SHOPIFY_API_KEY` = `a72a38e2a6289f2b8b802a980e67e810`
- [ ] `SHOPIFY_API_SECRET` = Your Shopify app client secret (from Shopify Partner Dashboard)
- [ ] `FRONTEND_URL` = `https://aesthetic-cucurucho-6aab1c.netlify.app`

### Edge Functions Deployed
Go to: https://supabase.com/dashboard/project/zbiuevrxbupsvmpfuqpq/functions

Verify these functions exist and are ACTIVE:

- [ ] `shopify-oauth-init` (verifyJWT: false)
- [ ] `shopify-oauth-callback` (verifyJWT: false)
- [ ] `generate-video` (verifyJWT: true)

### Database Tables
Go to: https://supabase.com/dashboard/project/zbiuevrxbupsvmpfuqpq/editor

Verify these tables exist with RLS enabled:

- [ ] `stores`
- [ ] `generated_videos`
- [ ] `credit_transactions`
- [ ] `subscription_plans`

## ✅ Netlify Configuration

### Environment Variables
Go to: Netlify Dashboard → Your Site → Site Settings → Environment Variables

Add these variables (if not already set):

- [ ] `VITE_SUPABASE_URL` = `https://zbiuevrxbupsvmpfuqpq.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

**How to get the anon key:**
1. Go to https://supabase.com/dashboard/project/zbiuevrxbupsvmpfuqpq/settings/api
2. Find "Project API keys" section
3. Copy the "anon public" key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Build Settings
Verify in Netlify Dashboard:

- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Node version: 18.x or higher

## ✅ Shopify App Configuration

### Get Your Shopify API Secret
1. Go to: https://partners.shopify.com
2. Navigate to: Apps → ProMotionAI → Client credentials
3. Copy the "Client secret" value
4. Add it to Supabase Edge Function Secrets (see above)

### App URLs
Go to: Shopify Partner Dashboard → Apps → ProMotionAI → Configuration → URLs

Set these exactly:

- [ ] **App URL**: `https://aesthetic-cucurucho-6aab1c.netlify.app`
- [ ] **Allowed redirection URL(s)**: `https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-oauth-callback`

### App Scopes
Verify these scopes are enabled in Configuration → Scopes:

- [ ] `read_analytics`
- [ ] `read_inventory`
- [ ] `read_orders`
- [ ] `read_product_listings`
- [ ] `read_products`
- [ ] `write_products`
- [ ] `read_content`
- [ ] `write_content`

### Embedded App
- [ ] "Embedded app" is enabled in Configuration

## ✅ Testing Checklist

### Before Deploying

- [ ] Local build completes without errors (`npm run build`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Edge functions respond correctly (test with curl or Postman)

### After Deploying to Netlify

- [ ] Site loads at `https://aesthetic-cucurucho-6aab1c.netlify.app`
- [ ] No console errors on homepage
- [ ] "Connect to Shopify" button appears

### After Installing on Test Store

- [ ] App opens in embedded iframe
- [ ] OAuth redirect to Shopify completes
- [ ] Redirects back to app successfully
- [ ] Store data is saved to Supabase `stores` table
- [ ] Dashboard loads with store information
- [ ] Products appear in product selector
- [ ] Video generation modal opens
- [ ] Credit balance displays correctly

## 🔧 Quick Tests

### Test Edge Function
```bash
curl "https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-oauth-init?shop=test.myshopify.com" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

Expected response:
```json
{"authUrl":"https://test.myshopify.com/admin/oauth/authorize?client_id=..."}
```

### Check Supabase Connection from Browser
Open browser console on your Netlify site and run:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Key is set' : 'Key is missing')
```

## 🚨 Common Issues

### "Supabase configuration missing"
- **Cause**: Environment variables not set in Netlify
- **Fix**: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify, then redeploy

### "accounts.shopify.com refused to connect"
- **Cause**: CSP headers blocking Shopify iframe
- **Fix**: Verify `_headers` and `netlify.toml` have correct CSP policy

### OAuth callback fails
- **Cause**: FRONTEND_URL not set or incorrect in Supabase
- **Fix**: Set FRONTEND_URL secret in Supabase Edge Functions

### Store not found after OAuth
- **Cause**: SHOPIFY_API_SECRET not set in Supabase
- **Fix**: Add SHOPIFY_API_SECRET to Supabase Edge Function secrets

## 📋 Final Verification

Before marking deployment complete:

- [ ] Fresh test store installation completes successfully
- [ ] All environment variables are set correctly
- [ ] OAuth flow works end-to-end
- [ ] Store data persists in database
- [ ] No errors in browser console
- [ ] No errors in Supabase Edge Function logs

## 🎉 Ready to Deploy!

If all checkboxes above are checked, you're ready to deploy!

1. Push code to your Git repository
2. Netlify will auto-deploy (or trigger manual deploy)
3. Test with a fresh Shopify development store
4. Monitor Supabase Edge Function logs for any issues

---

**Need help?** Check the full deployment guide in `DEPLOYMENT_GUIDE.md`
