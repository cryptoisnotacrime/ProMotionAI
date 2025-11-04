/*
  # Add Store Video Preferences

  ## Purpose
  Add fields to stores table for storing user's default video generation preferences
  that can be used to prefill the video generation form.

  ## Changes
  1. Add default video generation preference fields to stores table:
     - default_brand_name (text) - Brand name to use in videos
     - default_call_to_action (text) - Default CTA text
     - default_voice_over (text) - Default voice over text
     - default_voice_description (text) - Voice characteristics
     - instagram_handle (text) - Instagram username for brand consistency
     - tiktok_handle (text) - TikTok username for brand consistency
     - brand_description (text) - Brand description for context

  ## Notes
  - All fields are optional for backwards compatibility
  - These settings can be managed in the Settings page
  - Values will be used to prefill the video generation form
*/

-- Add video preference fields to stores table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'default_brand_name'
  ) THEN
    ALTER TABLE stores ADD COLUMN default_brand_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'default_call_to_action'
  ) THEN
    ALTER TABLE stores ADD COLUMN default_call_to_action text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'default_voice_over'
  ) THEN
    ALTER TABLE stores ADD COLUMN default_voice_over text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'default_voice_description'
  ) THEN
    ALTER TABLE stores ADD COLUMN default_voice_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'instagram_handle'
  ) THEN
    ALTER TABLE stores ADD COLUMN instagram_handle text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'tiktok_handle'
  ) THEN
    ALTER TABLE stores ADD COLUMN tiktok_handle text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_description'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_description text;
  END IF;
END $$;
