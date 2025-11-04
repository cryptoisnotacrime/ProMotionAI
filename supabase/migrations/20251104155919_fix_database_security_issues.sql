/*
  # Fix Database Security and Performance Issues

  ## Changes Made

  1. **Performance Improvements**
     - Add missing index on `credit_transactions.video_id` foreign key to improve join performance
     - This index will speed up queries that join credit_transactions with generated_videos

  2. **Index Cleanup**
     - Remove unused indexes from `generated_videos` table:
       - `idx_generated_videos_attached` (unused)
       - `idx_videos_status` (unused)
       - `idx_generated_videos_template` (unused)
       - `idx_generated_videos_veo_job_id` (unused)
     - Remove unused indexes from `video_templates` table:
       - `idx_video_templates_tier` (unused)
       - `idx_video_templates_category` (unused)
       - `idx_video_templates_sort` (unused)
     - Removing unused indexes reduces storage overhead and improves write performance

  3. **Security Fixes**
     - Fix search_path vulnerability in `update_video_templates_updated_at` function
     - Add explicit schema qualification to prevent search_path manipulation attacks
     - Set function security to SECURITY DEFINER with stable search_path

  ## Notes
  - Kept `idx_videos_store_id` and `idx_video_templates_active` as these are likely used
  - The credit_transactions.video_id index is critical for foreign key performance
*/

-- Step 1: Add missing index for credit_transactions.video_id foreign key
CREATE INDEX IF NOT EXISTS idx_credit_transactions_video_id 
ON credit_transactions(video_id);

-- Step 2: Remove unused indexes from generated_videos
DROP INDEX IF EXISTS idx_generated_videos_attached;
DROP INDEX IF EXISTS idx_videos_status;
DROP INDEX IF EXISTS idx_generated_videos_template;
DROP INDEX IF EXISTS idx_generated_videos_veo_job_id;

-- Step 3: Remove unused indexes from video_templates
DROP INDEX IF EXISTS idx_video_templates_tier;
DROP INDEX IF EXISTS idx_video_templates_category;
DROP INDEX IF EXISTS idx_video_templates_sort;

-- Step 4: Fix search_path security issue in trigger function
-- Drop trigger first, then function
DROP TRIGGER IF EXISTS update_video_templates_timestamp ON video_templates;
DROP TRIGGER IF EXISTS update_video_templates_updated_at_trigger ON video_templates;
DROP FUNCTION IF EXISTS update_video_templates_updated_at() CASCADE;

-- Recreate function with secure search_path
CREATE OR REPLACE FUNCTION public.update_video_templates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger with correct name
CREATE TRIGGER update_video_templates_timestamp
  BEFORE UPDATE ON public.video_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_video_templates_updated_at();
