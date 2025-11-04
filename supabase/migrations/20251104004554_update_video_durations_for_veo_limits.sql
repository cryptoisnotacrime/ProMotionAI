/*
  # Update Video Duration Limits for Veo API

  1. Changes to `subscription_plans` table
    - Update max_video_duration to match Veo API supported durations: 4, 6, 8 seconds
    - Free plan: 4 seconds
    - Basic plan: 6 seconds
    - Pro plan: 8 seconds
    - Enterprise plan: 8 seconds
  
  2. Important Notes
    - Google Veo API only supports durations of 4, 6, or 8 seconds
    - Any other duration values will cause API errors
*/

-- Update subscription plans with Veo-compatible durations
UPDATE subscription_plans 
SET max_video_duration = 4
WHERE plan_name = 'free';

UPDATE subscription_plans 
SET max_video_duration = 6
WHERE plan_name = 'basic';

UPDATE subscription_plans 
SET max_video_duration = 8
WHERE plan_name = 'pro';

UPDATE subscription_plans 
SET max_video_duration = 8
WHERE plan_name = 'enterprise';