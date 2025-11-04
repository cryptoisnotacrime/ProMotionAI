# Production Deployment Checklist

This checklist ensures your Shopify app is production-ready before deployment and submission to the Shopify App Store.

## ✅ Completed Items

### Security
- [x] RLS policies use proper shop domain validation via headers/JWT
- [x] No insecure `USING (true)` policies in production
- [x] All sensitive data uses RLS with shop-based access control
- [x] Webhook HMAC verification implemented
- [x] OAuth flow validates state parameter
- [x] Access tokens stored securely in database

### Billing
- [x] Hybrid pricing model implemented (base subscription + usage charges)
- [x] Usage rates consistent across all functions ($0.50/$0.30/$0.20)
- [x] Usage charges capped per plan (Free: $5, Basic: $50, Pro: $100)
- [x] Billing confirmation handler added to frontend
- [x] Subscription status tracked in database
- [x] Credit system tracks usage accurately

### Edge Functions
- [x] All edge functions deployed to Supabase
- [x] CORS headers properly configured on all functions
- [x] Error handling and logging implemented
- [x] Environment variables configured in Supabase

### Database
- [x] All tables have RLS enabled
- [x] Billing tables created (usage_charges, subscription fields)
- [x] Video storage bucket configured with proper permissions
- [x] Migrations documented with clear summaries

### Frontend
- [x] OAuth flow handles installation and reinstallation
- [x] Billing confirmation route handles charge_id parameter
- [x] Video polling implemented for long-running generations
- [x] Error messages user-friendly
- [x] Loading states on all async operations

## ⚠️ Action Required

### 1. Webhook Registration (CRITICAL)
**Status:** Must be done manually in Partner Dashboard

**Steps:**
1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Select your app
3. Navigate to **App Setup** → **Event subscriptions**
4. Register these webhooks to `https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-webhooks`:
   - `app/uninstalled` (Required for App Store)
   - `customers/data_request` (Required for GDPR)
   - `customers/redact` (Required for GDPR)
   - `shop/redact` (Required for GDPR)
   - `app_subscriptions/update` (Recommended for billing)
5. Set API version to `2024-01` or latest stable

**Reference:** See `WEBHOOK_SETUP.md` for detailed instructions

### 2. Environment Variables Verification
**Status:** Review required

Verify these environment variables are set in:
- Supabase Edge Functions
- Netlify (or your hosting provider)

**Required Variables:**
```
VITE_Bolt_Database_URL=https://zbiuevrxbupsvmpfuqpq.supabase.co
VITE_Bolt_Database_ANON_KEY=<your-anon-key>
SHOPIFY_API_KEY=<your-api-key>
SHOPIFY_API_SECRET=<your-api-secret>
SHOPIFY_SCOPES=write_products,read_products,write_content,read_content
GCP_SERVICE_ACCOUNT_JSON=<your-gcp-credentials>
```

**Action:** Review `.env.example` and ensure all variables are configured

### 3. Test OAuth Flow
**Status:** Manual testing required

**Test Steps:**
1. Install app on development store
2. Verify OAuth completes successfully
3. Check that store record created in database
4. Confirm access token saved and working
5. Test app reinstallation (should trigger new OAuth)

**Expected Result:** App loads successfully in Shopify admin with embedded UI

### 4. Test Billing Flow
**Status:** Manual testing required

**Test Steps:**
1. Navigate to billing section in app
2. Select a paid plan (Basic or Pro)
3. Approve subscription charge in Shopify
4. Verify redirect back to app with `charge_id` parameter
5. Confirm subscription status updated to "active" in database
6. Generate a video to test usage charges
7. Check usage_charges table for recorded charges

**Expected Result:** Subscription activates and usage charges are created

### 5. Test Video Generation
**Status:** Manual testing required

**Test Steps:**
1. Select a product with image
2. Choose a template and customize inputs
3. Generate video
4. Wait for completion (5-10 minutes)
5. Verify video appears in library
6. Test adding video to product
7. Check video appears in Shopify product admin

**Expected Result:** Video generates successfully and attaches to product

### 6. Test Webhooks
**Status:** Manual testing required

**Test Steps:**
1. After webhook registration, trigger test webhooks from Partner Dashboard
2. Check Supabase Edge Function logs for webhook activity
3. Test app uninstall webhook by uninstalling app from test store
4. Verify store data marked as uninstalled in database

**Expected Result:** All webhooks process successfully without errors

### 7. App Store Assets
**Status:** Not included - must be created

**Required Assets:**
- App icon (512x512 PNG)
- Screenshots (desktop and mobile views)
- App listing description
- Privacy policy URL
- Support email
- Demo video (optional but recommended)

**Action:** Create marketing materials for App Store listing

### 8. Privacy Policy & GDPR
**Status:** Review required

**Required Documentation:**
- Privacy policy explaining data collection
- GDPR compliance statement
- Data retention policy
- Data deletion process

**Action:** Review GDPR compliance in `WEBHOOK_SETUP.md` and create privacy policy

### 9. Testing Checklist
**Status:** Manual testing required

Run through these scenarios:

**Installation:**
- [ ] Fresh install on new store
- [ ] Reinstall after uninstall
- [ ] Install with existing OAuth token

**Billing:**
- [ ] Subscribe to Free plan
- [ ] Upgrade to Basic plan
- [ ] Upgrade to Pro plan
- [ ] Generate videos beyond credit limit
- [ ] Verify usage charges created
- [ ] Check usage charge caps enforced

**Video Generation:**
- [ ] Generate 5-second video (Free plan)
- [ ] Generate 8-second video (Basic plan)
- [ ] Generate 15-second video (Pro plan)
- [ ] Test both 9:16 and 16:9 aspect ratios
- [ ] Verify video downloads to storage
- [ ] Test video attachment to product

**Error Handling:**
- [ ] Test with invalid product ID
- [ ] Test with insufficient credits
- [ ] Test with invalid aspect ratio
- [ ] Test OAuth with wrong credentials
- [ ] Test billing with declined charge

**GDPR:**
- [ ] Trigger customer data request
- [ ] Trigger customer data erasure
- [ ] Trigger shop data erasure
- [ ] Verify data deleted properly

### 10. Performance & Monitoring
**Status:** Configure monitoring

**Action Items:**
- Set up error tracking (Sentry, Bugsnag, etc.)
- Configure uptime monitoring
- Set up alerts for failed webhooks
- Monitor Edge Function logs in Supabase
- Track video generation success/failure rates

### 11. Documentation Review
**Status:** Review required

**Files to Review:**
- [ ] `README.md` - Accurate setup instructions
- [ ] `DEPLOYMENT_GUIDE.md` - Deployment steps clear
- [ ] `WEBHOOK_SETUP.md` - Webhook registration instructions
- [ ] `SHOPIFY_SETUP.md` - Shopify configuration guide
- [ ] This checklist - All items addressed

## 📊 Pre-Submission Checklist

Before submitting to Shopify App Store:

- [ ] All webhooks registered and tested
- [ ] App tested on multiple development stores
- [ ] Billing flow fully functional
- [ ] Video generation working consistently
- [ ] All GDPR webhooks implemented
- [ ] Privacy policy published and linked
- [ ] Support email configured and monitored
- [ ] App listing completed with screenshots
- [ ] App reviewed by at least 2 team members
- [ ] Performance acceptable (load times, video generation)
- [ ] Error handling graceful with user-friendly messages
- [ ] No exposed API keys or secrets in code
- [ ] All environment variables documented

## 🚀 Deployment Steps

1. **Deploy Frontend:**
   - Build: `npm run build`
   - Deploy to Netlify or hosting provider
   - Configure environment variables
   - Test deployed app with Shopify store

2. **Verify Edge Functions:**
   - All functions deployed to Supabase
   - Test each function endpoint
   - Check logs for errors

3. **Register Webhooks:**
   - Follow `WEBHOOK_SETUP.md` instructions
   - Test each webhook type

4. **Final Testing:**
   - Install on fresh development store
   - Complete full user flow
   - Generate test videos
   - Verify billing works

5. **Submit to App Store:**
   - Complete app listing
   - Submit for review
   - Monitor for approval/feedback

## 📞 Support Contacts

**If Issues Arise:**
- Shopify Support: partners@shopify.com
- Supabase Support: support@supabase.io
- Google Cloud Support: For Veo API issues

## 📝 Post-Launch Tasks

After app is live:
- Monitor error logs daily
- Track video generation success rates
- Monitor webhook delivery
- Collect user feedback
- Track billing metrics
- Monitor credit usage patterns
- Update documentation as needed

---

**Last Updated:** 2025-11-04
**Version:** 1.0
