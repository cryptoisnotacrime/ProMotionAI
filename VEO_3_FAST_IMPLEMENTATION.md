# Veo 3 Fast Implementation

## Model Details

**Model Name:** `veo-3-fast-generate`

### Specifications
- **Feature:** Video generation (video-only, no audio)
- **Description:** Generate videos from a text prompt or reference image faster
- **Input:** Text/Image prompt
- **Output:** Video
- **Resolution:** 720p, 1080p
- **Pricing:** $0.10 per second

## Implementation

### Edge Function (generate-video)
**File:** `supabase/functions/generate-video/index.ts`
- Uses `veo-3-fast-generate` model
- Endpoint: `publishers/google/models/veo-3-fast-generate:predictLongRunning`
- Location: `us-central1`

### Credit System
**File:** `src/services/ai-generator/video.service.ts`
- **Credit Calculation:** 1 credit = 1 second of video
- **Cost per Credit:** $0.10 (matching Veo 3 Fast pricing)
- **API Cost Tracking:** `durationSeconds * 0.10`

### Database
**Table:** `generated_videos`
- Default `veo_model`: `'veo-3-fast-generate'`
- Migration applied to update existing preview model references

## Comparison with Other Veo Models

| Model | Feature | Price/Second | Audio | Notes |
|-------|---------|--------------|-------|-------|
| **Veo 3 Fast** | Video generation | **$0.10** | ❌ | ✅ **Current Implementation** - Fastest, cheapest |
| Veo 3 Fast | Video + Audio | $0.15 | ✅ | Includes synchronized speech/sound effects |
| Veo 3 | Video generation | $0.20 | ❌ | Higher quality, slower |
| Veo 3 | Video + Audio | $0.40 | ✅ | Premium quality with audio |
| Veo 2 | Video generation | $0.50 | ❌ | Legacy model, 720p only |

## Benefits

1. **Cost Effective:** 50% cheaper than standard Veo 3 ($0.10 vs $0.20)
2. **Fast Generation:** Optimized for speed
3. **Good Quality:** Supports up to 1080p resolution
4. **Production Ready:** Stable API endpoint

## Limitations

- Video-only output (no audio/speech)
- For audio features, would need to upgrade to Veo 3 Fast Video+Audio ($0.15/second)

## Duration Limits by Plan

- **Free Plan:** 5 seconds max
- **Basic Plan:** 8 seconds max
- **Pro Plan:** 15 seconds max

## Credit Costs Examples

- 5-second video = 5 credits = $0.50 API cost
- 8-second video = 8 credits = $0.80 API cost
- 15-second video = 15 credits = $1.50 API cost
