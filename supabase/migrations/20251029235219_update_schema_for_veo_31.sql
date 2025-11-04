/*
  # Update Schema for Veo 3.1 Integration

  1. Changes to `generated_videos` table
    - Add `veo_job_id` to track async generation jobs
    - Add `veo_model` to track which model was used (standard vs fast)
    - Add `api_cost_usd` to track actual API costs
    - Add `video_downloaded` to track if video is stored locally
    - Add `expires_at` to track when Veo URL expires (2 days)
    - Update `credits_used` calculation to match actual duration
  
  2. Changes to `subscription_plans` table
    - Update max_video_duration to 15s cap
    - Update credit allocations
  
  3. Important Notes
    - Veo 3.1 videos expire after 2 days
    - Need to download and store videos in our own storage
    - API charges only for successful generations
*/

-- Add new columns to generated_videos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_videos' AND column_name = 'veo_job_id'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN veo_job_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_videos' AND column_name = 'veo_model'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN veo_model text DEFAULT 'veo-3.1-fast-generate-preview';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_videos' AND column_name = 'api_cost_usd'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN api_cost_usd numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_videos' AND column_name = 'video_downloaded'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN video_downloaded boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_videos' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Update subscription plans with new credit allocations and 15s max
UPDATE subscription_plans 
SET 
  credits_per_cycle = 10,
  max_video_duration = 5
WHERE plan_name = 'free';

UPDATE subscription_plans 
SET 
  credits_per_cycle = 100,
  max_video_duration = 8
WHERE plan_name = 'basic';

UPDATE subscription_plans 
SET 
  credits_per_cycle = 200,
  max_video_duration = 15
WHERE plan_name = 'pro';

UPDATE subscription_plans 
SET 
  credits_per_cycle = 500,
  max_video_duration = 15
WHERE plan_name = 'enterprise';

-- Add index on veo_job_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_videos_veo_job_id 
ON generated_videos(veo_job_id) 
WHERE veo_job_id IS NOT NULL;