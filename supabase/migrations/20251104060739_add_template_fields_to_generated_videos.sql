/*
  # Add Template Fields to Generated Videos

  ## Purpose
  Track which template and inputs were used for each generated video.

  ## Changes
  1. Add `template_id` column to reference the video_templates table
  2. Add `template_inputs` jsonb column to store the user inputs used to populate the template

  ## Notes
  - These fields are optional to maintain backwards compatibility
  - template_id is a foreign key reference (but nullable for existing records)
  - template_inputs stores the complete input object for reproducibility
*/

-- Add template tracking columns to generated_videos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_videos' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN template_id uuid REFERENCES video_templates(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_videos' AND column_name = 'template_inputs'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN template_inputs jsonb;
  END IF;
END $$;

-- Create index for template lookups
CREATE INDEX IF NOT EXISTS idx_generated_videos_template ON generated_videos(template_id);
