/*
  # Rollback Veo Model to Working Version

  ## Changes Made

  1. **Revert to veo-3.1-fast-generate-preview**
     - The model name 'veo-3-fast-generate' does not exist in Google Vertex AI API yet
     - Reverting to the working model: 'veo-3.1-fast-generate-preview'
     - This is a preview/beta model that is currently available

  2. **Model Specifications**
     - Model: veo-3.1-fast-generate-preview (currently available)
     - Status: Preview/Beta
     - Resolution: 720p, 1080p
     - Input: Text/Image prompt
     - Output: Video

  ## Notes
  - veo-3-fast-generate will be used when Google makes it publicly available
  - This rollback fixes the 404 "NOT_FOUND" error in video generation
  - All functionality remains the same, just using the available model name
*/

-- Revert the default veo_model back to the working version
ALTER TABLE generated_videos 
  ALTER COLUMN veo_model SET DEFAULT 'veo-3.1-fast-generate-preview';

-- Update any records that were set to the non-existent model
UPDATE generated_videos 
SET veo_model = 'veo-3.1-fast-generate-preview'
WHERE veo_model = 'veo-3-fast-generate'
  AND generation_status IN ('pending', 'processing');
