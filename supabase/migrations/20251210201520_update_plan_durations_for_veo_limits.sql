/*
  # Update Plan Durations for Veo 3.1 API Limits

  1. Changes
    - Update Free plan: max_video_duration from 5s to 4s
    - Update Basic plan: max_video_duration from 10s to 6s
    - Update Pro plan: max_video_duration from 30s to 8s
    - Update feature descriptions to match actual Veo capabilities
    - Add multi-image as Pro-exclusive feature

  2. Rationale
    - Veo 3.1 API requires 8 seconds when using multiple reference images
    - Only Pro plan can generate 8-second videos
    - Therefore, multi-image generation must be Pro-only

  3. Plan Tiers After Update
    - Free: 4s videos only
    - Basic: Up to 6s videos (4s, 6s)
    - Pro: Up to 8s videos (4s, 6s, 8s) + Multi-image support
*/

UPDATE subscription_plans
SET
  max_video_duration = 4,
  features = '["4s videos", "10 credits/month", "Basic support"]'
WHERE plan_name = 'free';

UPDATE subscription_plans
SET
  max_video_duration = 6,
  features = '["Up to 6s videos", "50 credits/month", "Email support", "HD quality"]'
WHERE plan_name = 'basic';

UPDATE subscription_plans
SET
  max_video_duration = 8,
  features = '["Up to 8s videos", "Multiple reference images", "150 credits/month", "Priority support", "HD quality", "Custom branding"]'
WHERE plan_name = 'pro';

UPDATE subscription_plans
SET
  max_video_duration = 8,
  features = '["Up to 8s videos", "Multiple reference images", "500 credits/month", "24/7 support", "HD quality", "API access", "Custom integrations"]'
WHERE plan_name = 'enterprise';
