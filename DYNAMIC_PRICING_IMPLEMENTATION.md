# Dynamic VEO Model Selection & Margin-Based Pricing

## Overview

This implementation adds intelligent model selection and margin-based pricing for video generation using Google Cloud's VEO 3.1 models.

## Key Features

### 1. Dynamic Model Selection

The system automatically selects the optimal VEO model based on whether reference images are present:

- **With Images** → `veo-3.1-fast-generate-preview` at $0.10/second
- **Without Images** → `veo-3.1-generate-preview` at $0.20/second

Since your Shopify product videos always include product images, you'll consistently use the faster, cheaper Fast model.

### 2. Margin-Based Credit Pricing

Credits now include a 50% profit margin built into the pricing:

**Credit Calculation Formula:**
```
baseCredits = ceil(duration × modelCost × 1.5)
imageSurcharge = imageCount > 1 ? 1 : 0
totalCredits = baseCredits + imageSurcharge
```

**Examples:**
- 4-second video (1 image): 1 credit (4s × $0.10 × 1.5 = $0.60 → 1 credit)
- 6-second video (1 image): 1 credit (6s × $0.10 × 1.5 = $0.90 → 1 credit)
- 8-second video (1 image): 2 credits (8s × $0.10 × 1.5 = $1.20 → 2 credits)
- 8-second video (2+ images): 3 credits (2 base + 1 surcharge)

### 3. Accurate Cost Tracking

The database now tracks:
- **Actual API cost** based on the model used
- **Model name** that was selected
- **Credits charged** to the customer
- **Profit margin** implicit in the difference

### 4. Flexible Video Durations

All three duration options work correctly:
- **4 seconds** - Available on all plans
- **6 seconds** - Available on Basic and above
- **8 seconds** - Available on Basic and above
- **Multiple Angles mode** - Requires 8 seconds only when using 2+ images

### 5. First/Last Frame Support

Both image modes are fully supported:
- **Multiple Angles** - Uses multiple product views throughout the video
- **First & Last Frame** - Creates smooth transition between two key frames

## Technical Implementation

### Files Modified

1. **src/constants/video-generation.ts**
   - Added `VEO_PRICING` configuration object
   - Added `calculateCreditsRequired()` function
   - Added `calculateApiCost()` function
   - Added `getVeoModel()` function

2. **src/services/ai-generator/video.service.ts**
   - Updated credit calculation to use margin-based pricing
   - Added dynamic model selection before video creation
   - Updated database record with accurate API costs
   - Added metadata tracking for model selection

3. **supabase/functions/generate-video/index.ts**
   - Added dynamic model selection based on image presence
   - Calculates actual API cost per second
   - Updates video record with correct model name and cost
   - Added logging for model selection and cost tracking

4. **src/components/product-selector/GenerationModal.tsx**
   - Updated to use new credit calculation function
   - Automatically shows correct credit cost to users

## Pricing Summary

| Scenario | Duration | API Cost | Credits Charged | Margin |
|----------|----------|----------|-----------------|--------|
| 1 image, 4s | 4 seconds | $0.40 | 1 credit | 150% |
| 1 image, 6s | 6 seconds | $0.60 | 1 credit | 67% |
| 1 image, 8s | 8 seconds | $0.80 | 2 credits | 150% |
| 2 images, 8s | 8 seconds | $0.80 | 3 credits | 275% |

## Benefits

1. **Cost Efficiency** - Always uses the cheaper Fast model when images present
2. **Profitability** - Built-in 50% margin on base video generation
3. **Transparency** - Accurate tracking of actual API costs vs. credits charged
4. **Flexibility** - Supports 4, 6, and 8 second videos
5. **Scalability** - Can easily adjust margin multiplier in constants file

## Configuration

To adjust the pricing margin, edit `src/constants/video-generation.ts`:

```typescript
export const VEO_PRICING = {
  CREDIT_MARGIN_MULTIPLIER: 1.5, // Change this value to adjust margin
  MULTI_IMAGE_SURCHARGE: 1,      // Flat fee for 2+ images
}
```

**Margin Examples:**
- 1.25 = 25% margin
- 1.5 = 50% margin (current)
- 2.0 = 100% margin

## Next Steps

Consider adding:
- Plan-based margin tiers (higher margin for free tier, lower for pro)
- Volume discounts for bulk video generation
- Premium pricing for longer videos (15+ seconds)
