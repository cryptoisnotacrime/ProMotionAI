# Video Generation & Publishing Workflow

## Overview
This document describes the complete video generation and publishing workflow for the PromotionAI application.

## Workflow Steps

### 1. Video Generation
**Location**: Product Selector → Generate Video

1. User selects a product from their Shopify store
2. User customizes the video prompt and duration
3. System generates video using Google's Veo 3.1 API
4. Video is saved to Supabase Storage (not immediately published to Shopify)
5. User is redirected to Video Library

### 2. Video Review in Library
**Location**: Video Library

After generation completes, users see their video with the following options:

#### For videos NOT yet added to Shopify:
- **Add to Shopify** (Green button) - Publishes the video to the product page
- **View** - Opens full preview modal
- **Download** - Downloads the video file locally
- **Delete** - Permanently removes the video

#### For videos already on Shopify:
- **✓ Added to Product** (Green badge) - Indicates video is live on Shopify
- **View** - Opens full preview modal
- **Download** - Downloads the video file
- **Delete** - Removes from library (does not remove from Shopify product)

### 3. Adding Video to Shopify Product
**Trigger**: Click "Add to Shopify" button

1. Video is fetched from Supabase Storage
2. Video is uploaded to Shopify via GraphQL API
3. Video is attached to the original product
4. Video becomes visible on the Shopify product page immediately
5. Database record is updated with `attached_to_product: true`

## Technical Implementation

### Storage Flow
1. **Generation**: Veo API → Supabase Storage
2. **Publishing**: Supabase Storage → Shopify Product Media

### Key Components
- `VideoLibrary.tsx` - Main UI for video management
- `add-video-to-product` Edge Function - Handles Shopify upload
- `AddVideoToShopifyService` - Frontend service for API calls

### Database Fields
- `video_url` - Signed URL from Supabase Storage (7-day expiry)
- `video_downloaded` - Boolean flag if video is in storage
- `attached_to_product` - Boolean flag if video is on Shopify
- `shopify_media_id` - Shopify's media GID for the video

## User Benefits

### Review Before Publishing
- Users can preview videos before making them live
- Allows for quality control
- Option to regenerate if not satisfied
- No risk of publishing unwanted content

### Flexible Management
- Keep videos in library for future use
- Download videos for other marketing purposes
- Delete videos that don't meet quality standards
- Track which videos are published vs. in draft

### Cost Efficiency
- Credits are charged at generation time
- Publishing to Shopify is free
- Users can review multiple versions before choosing
- Download videos for use across platforms
