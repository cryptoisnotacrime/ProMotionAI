# Developer Handoff Guide: PromotionAI Shopify App

## Project Overview

**PromotionAI** is a Shopify app that generates AI-powered product videos using Google's Veo 3 API. Merchants can connect their Shopify store, select products, generate professional videos, and optionally share them to Instagram/TikTok.

**Current Status:** ✅ Core functionality complete | ⚠️ Legal documents required before launch

---

## Technical Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Hosting:** Netlify (configured)
- **APIs:** Shopify Admin API, Instagram Graph API, TikTok for Developers, Google Veo 3
- **Authentication:** Shopify OAuth + Instagram OAuth + TikTok OAuth

---

## What's Built ✅

### Core Features
- ✅ Shopify OAuth integration (install/uninstall flow)
- ✅ Product catalog display with image picker
- ✅ AI video generation (3 templates: Cinematic, Lifestyle, UGC)
- ✅ Business DNA onboarding (brand customization)
- ✅ Video library with preview/download
- ✅ Video attachment to Shopify products
- ✅ Instagram/TikTok OAuth connections
- ✅ Credit-based billing system (integrated with Shopify Billing API)
- ✅ RLS security policies on all database tables
- ✅ Video storage with signed URLs (30-day retention)

### Deployment Infrastructure
- ✅ Netlify configuration (netlify.toml, redirects, headers)
- ✅ Environment variables documented (.env.example)
- ✅ Database migrations (24 files in supabase/migrations/)
- ✅ Edge functions deployed (14 functions)
- ✅ CORS configured for API calls

---

## What's Missing ⚠️

### 1. Legal Documents (BLOCKER FOR LAUNCH)

The following pages must be created and hosted before submitting to Shopify App Store or going live with social media integrations:

#### Required Pages
- **Privacy Policy** (mandatory for Shopify + Instagram + TikTok)
- **Terms of Service** (mandatory for app usage)
- **Data Deletion Instructions** (mandatory for Instagram App Review)
- **Support Page** (mandatory for Shopify listing)

#### Optional but Recommended
- **Cookie Policy** (GDPR compliance)
- **Data Processing Agreement** (required for EU merchants)

### 2. Legal Page Implementation

**Technical Requirements:**
```
Route Structure:
  /privacy-policy
  /terms-of-service
  /data-deletion
  /support
  /cookies (optional)

Implementation:
  - Create simple React components (no special functionality needed)
  - Add routes to App.tsx
  - Include footer links in Navbar component
  - Ensure mobile-responsive
```

**Suggested Component Structure:**
```typescript
// src/components/legal/PrivacyPolicy.tsx
// src/components/legal/TermsOfService.tsx
// src/components/legal/DataDeletion.tsx
// src/components/legal/Support.tsx
```

---

## Data Collection Details (For Policy Generation)

Provide these to your legal template service or lawyer:

### Personal Data Collected
```
Store Information:
  - Shopify store domain (e.g., mystore.myshopify.com)
  - Store owner email address
  - Store name and business details

Product Data:
  - Product titles, descriptions, images
  - Product metadata (price, tags, variants)

OAuth Tokens:
  - Instagram access token (encrypted, 60-day expiry)
  - TikTok access token (encrypted, refresh handled automatically)
  - Shopify access token (encrypted, permanent until uninstall)

Generated Content:
  - AI-generated videos (MP4, stored 30 days)
  - Video metadata (template used, generation date, status)

Usage Analytics:
  - Video generation count
  - Credit consumption
  - Feature usage (template selection, social connections)

Billing Data:
  - Handled entirely by Shopify Billing API
  - We do NOT store credit card info
  - Subscription status tracked in our DB
```

### Third-Party Services & Data Sharing
```
Service Name          | Purpose                | Data Shared               | Location
--------------------|------------------------|---------------------------|----------
Supabase            | Database & API         | All app data              | USA
Google Cloud (Veo)  | Video generation       | Product images + prompts  | USA
Shopify             | Auth & billing         | Store info                | Canada
Instagram (Meta)    | Photo import           | OAuth token only          | USA
TikTok              | Video publishing       | OAuth token + videos      | USA
Netlify             | App hosting            | None (static hosting)     | USA
```

### Data Retention
```
Account Data:        Until merchant uninstalls + 30 days grace period
Generated Videos:    30 days after creation (auto-deleted from storage)
OAuth Tokens:        Until disconnection or expiry
Usage History:       12 months (for billing/support purposes)
Billing Records:     Per Shopify's retention policy
```

### User Rights (GDPR/CCPA Compliance)
```
Access:      Merchants can download all videos via Video Library
Deletion:    One-click uninstall removes all data within 30 days
             Manual deletion available via Settings
Portability: Videos exported as standard MP4 files
Opt-out:     Disconnect social accounts anytime (revokes OAuth)
Correction:  Edit Business DNA settings anytime
```

---

## Configuration URLs Needed

Once legal pages are live, add these URLs to platform dashboards:

### Shopify Partner Dashboard
```
App Listing → Privacy & Compliance:
  Privacy Policy URL:        https://your-app.netlify.app/privacy-policy
  Support URL:               https://your-app.netlify.app/support
  GDPR Webhooks:            Already configured in code
```

### Instagram App Dashboard (developers.facebook.com)
```
Settings → Basic:
  Privacy Policy URL:        https://your-app.netlify.app/privacy-policy
  Terms of Service URL:      https://your-app.netlify.app/terms-of-service
  User Data Deletion:        https://your-app.netlify.app/data-deletion
```

### TikTok Developer Portal
```
App Settings:
  Privacy Policy URL:        https://your-app.netlify.app/privacy-policy
  Terms of Service URL:      https://your-app.netlify.app/terms-of-service
```

---

## Recommended Legal Service Options

### Option 1: DIY Template Generator (Fastest)
- **Termly.io** - $99/year, generates compliant policies in 20 minutes
- **iubenda** - $27/month, specialized for OAuth apps

### Option 2: Template + Lawyer Review (Recommended)
1. Generate draft from Termly ($99)
2. Have tech lawyer review ($500-$800)
3. Make adjustments

### Option 3: Full Legal Service (Most Thorough)
- SaaS lawyer drafts custom policies ($1,500-$3,000)
- Covers liability, indemnification, arbitration clauses

---

## Pre-Launch Checklist

### Legal Tasks
- [ ] Generate Privacy Policy (using Termly/iubenda or lawyer)
- [ ] Generate Terms of Service
- [ ] Create Data Deletion instructions page
- [ ] Create Support page with contact email
- [ ] Add footer links to all legal pages in Navbar component
- [ ] Test all pages are accessible (no auth required)
- [ ] Update Shopify Partner dashboard with URLs
- [ ] Update Instagram App dashboard with URLs
- [ ] Update TikTok Developer dashboard with URLs

### Technical Tasks
- [ ] Verify all environment variables set in Netlify
- [ ] Test Shopify OAuth flow end-to-end
- [ ] Test Instagram OAuth flow
- [ ] Test TikTok OAuth flow
- [ ] Test video generation with all 3 templates
- [ ] Test video attachment to Shopify products
- [ ] Test credit deduction system
- [ ] Test uninstall webhook (data deletion)
- [ ] Verify signed URLs work for video playback
- [ ] Run `npm run build` to ensure no errors

### Compliance Testing
- [ ] Install app → verify GDPR consent if EU merchant
- [ ] Generate video → verify credit deduction
- [ ] Uninstall app → verify all data deleted within 30 days
- [ ] Test "Export Data" functionality (download videos)
- [ ] Verify RLS policies prevent cross-store data access

---

## Support & Documentation

Existing docs in the repo:
- `SHOPIFY_SETUP.md` - Shopify OAuth configuration
- `OAUTH_FLOW.md` - Instagram/TikTok OAuth flows
- `DEPLOYMENT_GUIDE.md` - Netlify deployment steps
- `PRODUCTION_CHECKLIST.md` - Pre-launch verification
- `WEBHOOK_SETUP.md` - Shopify webhook configuration

---

## Questions?

Contact: [Your contact info]
Repo: `/tmp/cc-agent/59346967/project`
Live Preview: `npm run dev` (runs on localhost:5173)
