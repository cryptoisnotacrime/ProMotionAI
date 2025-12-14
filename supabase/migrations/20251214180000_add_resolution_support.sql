/*
  # Add Resolution Support to Video Generation

  1. Changes to Tables
    - `generated_videos`
      - Add `resolution` column (text) to track video resolution (720p or 1080p)
      - Default value: '720p' for existing and new videos
    
    - `subscription_plans`
      - Add resolution feature to features array for each plan
      - Free/Basic: 720p only
      - Pro/Enterprise: 720p and 1080p
  
  2. Security
    - No RLS changes needed (existing policies remain)
  
  3. Important Notes
    - All existing videos will default to 720p resolution
    - Resolution field is used for UI display and analytics
    - Backend validation in edge function ensures Pro access for 1080p
*/

-- Add resolution field to generated_videos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_videos' AND column_name = 'resolution'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN resolution text DEFAULT '720p';
  END IF;
END $$;

-- Update subscription plans with resolution feature
UPDATE subscription_plans
SET features = features || '["720p resolution"]'::jsonb
WHERE plan_name IN ('free', 'basic')
AND NOT features::text LIKE '%resolution%';

UPDATE subscription_plans
SET features = features || '["720p & 1080p resolution"]'::jsonb
WHERE plan_name IN ('pro', 'enterprise')
AND NOT features::text LIKE '%resolution%';