# Shopify Webhook Setup Guide

This guide explains how to register webhooks for your Shopify app to handle app lifecycle events and GDPR compliance.

## Webhook Endpoint

Your webhook endpoint is now deployed at:
```
https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-webhooks
```

## Required Webhooks

You must register these webhooks to comply with Shopify App Store requirements:

### GDPR & Lifecycle Webhooks (Required)

#### 1. App Uninstalled
- **Topic:** `app/uninstalled`
- **Purpose:** Notifies when a merchant uninstalls your app
- **Action:** Cancels subscription and removes access token

#### 2. Customer Data Request (GDPR)
- **Topic:** `customers/data_request`
- **Purpose:** GDPR compliance - merchant requests customer data
- **Action:** Returns all customer data (videos, transactions, store info)

#### 3. Customer Data Erasure (GDPR)
- **Topic:** `customers/redact`
- **Purpose:** GDPR compliance - customer requests data deletion
- **Action:** Deletes customer-specific videos and transactions

#### 4. Shop Data Erasure (GDPR)
- **Topic:** `shop/redact`
- **Purpose:** GDPR compliance - delete all store data after 48 hours
- **Action:** Deletes all store data including videos, transactions, preferences, and business DNA

### Billing Webhooks (Recommended for Subscription Apps)

#### 5. Subscription Update
- **Topic:** `app_subscriptions/update`
- **Purpose:** Notifies when subscription status changes
- **Action:** Updates subscription status in database

**Note:** These webhooks are automatically handled by the same endpoint. The handler routes each webhook to the appropriate action based on the `X-Shopify-Topic` header.

## Registration Methods

### Method 1: Via Partner Dashboard (Recommended for Production)

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Select your app
3. Navigate to **App Setup** → **Event subscriptions**
4. Click **Add subscription**
5. For each webhook topic:
   - Enter the endpoint URL: `https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-webhooks`
   - Select the topic
   - Select API version: `2024-01` or latest
   - Click **Save**

### Method 2: Via Shopify Admin API (For Testing)

Use the GraphQL Admin API to register webhooks programmatically:

```graphql
mutation {
  webhookSubscriptionCreate(
    topic: APP_UNINSTALLED
    webhookSubscription: {
      format: JSON
      callbackUrl: "https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-webhooks"
    }
  ) {
    webhookSubscription {
      id
      topic
      format
      endpoint {
        __typename
        ... on WebhookHttpEndpoint {
          callbackUrl
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

Repeat for each topic:
- `APP_UNINSTALLED`
- `CUSTOMERS_DATA_REQUEST`
- `CUSTOMERS_REDACT`
- `SHOP_REDACT`
- `APP_SUBSCRIPTIONS_UPDATE` (optional but recommended)

## Webhook Verification

The webhook handler automatically verifies all incoming webhooks using HMAC SHA-256 signature verification. This ensures webhooks are authentic and come from Shopify.

### How Verification Works

1. Shopify sends webhook with `X-Shopify-Hmac-Sha256` header
2. Handler computes HMAC using your `SHOPIFY_API_SECRET`
3. Compares computed signature with received signature
4. Rejects webhook if signatures don't match

### Environment Variables

The webhook handler uses these environment variables (automatically configured in Supabase):

- `SHOPIFY_API_SECRET` - Your app's API secret key (for webhook verification)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database operations

## Testing Webhooks

### 1. Using Shopify CLI

If you have Shopify CLI installed, you can trigger test webhooks:

```bash
shopify app webhook trigger --topic=app/uninstalled
```

### 2. Manual Testing with cURL

```bash
# Note: You'll need to generate a valid HMAC signature
curl -X POST https://zbiuevrxbupsvmpfuqpq.supabase.co/functions/v1/shopify-webhooks \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: app/uninstalled" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "X-Shopify-Hmac-Sha256: <valid-hmac>" \
  -d '{"domain":"your-store.myshopify.com"}'
```

### 3. Via Partner Dashboard

In the Partner Dashboard, you can send test webhooks under **Event subscriptions**.

## Monitoring Webhooks

### Check Webhook Logs

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **shopify-webhooks**
3. Click on **Logs** to view webhook activity

### Common Log Messages

- `Webhook received: app/uninstalled from store.myshopify.com` - Webhook received successfully
- `Webhook verification failed` - HMAC signature mismatch
- `Store not found: store.myshopify.com` - Store not in database
- `Processing GDPR data request for store.myshopify.com` - Handling GDPR request

## Troubleshooting

### Webhook Returns 401 Unauthorized

**Cause:** HMAC verification failed

**Solutions:**
- Verify `SHOPIFY_API_SECRET` is correctly set in Supabase
- Check that you're using the API secret (not API key)
- Ensure webhook is coming from Shopify (not a test tool without valid signature)

### Webhook Returns 404 Store Not Found

**Cause:** Store not found in database

**Solutions:**
- Verify store completed OAuth flow
- Check store's shop_domain matches exactly
- Ensure store wasn't deleted from database

### Webhook Not Firing

**Causes & Solutions:**
- **Webhook not registered:** Register webhook in Partner Dashboard
- **Wrong URL:** Verify endpoint URL is correct
- **API version mismatch:** Use latest stable API version
- **App not installed:** Install app on a test store

## GDPR Compliance Notes

### Data Request Timeline
- Merchant requests customer data
- You have **30 days** to provide the data
- Handler returns data immediately via webhook response

### Data Erasure Timeline
- **customers/redact:** Delete customer data immediately
- **shop/redact:** Delete all store data within **48 hours** of app uninstall

### Data Returned for GDPR Requests

The handler returns:
```json
{
  "store": {
    "shop_domain": "store.myshopify.com",
    "store_name": "My Store",
    "email": "store@example.com",
    "subscription_status": "active",
    "credits_available": 100
  },
  "videos": [...],
  "transactions": [...]
}
```

## Next Steps

1. ✅ Register all four required webhooks
2. ✅ Test each webhook type
3. ✅ Monitor logs for any errors
4. ✅ Update privacy policy to reflect data handling
5. ✅ Submit app for review

## Resources

- [Shopify Webhooks Documentation](https://shopify.dev/docs/apps/webhooks)
- [GDPR Compliance Guide](https://shopify.dev/docs/apps/launch/privacy-compliance)
- [Webhook Topics Reference](https://shopify.dev/docs/api/admin-rest/latest/resources/webhook#event-topics)
