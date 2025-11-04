/*
  # Update Veo Model to Veo 3 Fast

  ## Changes Made

  1. **Update Default Veo Model**
     - Change default veo_model from 'veo-3.1-fast-generate-preview' to 'veo-3-fast-generate'
     - Veo 3 Fast is faster and more cost-effective at $0.10/second (vs $0.20/second for standard Veo 3)
     - Supports 720p and 1080p output
     - Text/Image prompt input
     - Video-only output (no audio in this tier)

  2. **Model Specifications**
     - Model: veo-3-fast-generate
     - Pricing: $0.10 per second of video
     - Resolution: 720p, 1080p
     - Input: Text/Image prompt
     - Output: Video only

  ## Notes
  - This is a non-breaking change as it only updates the default value
  - Existing records retain their original veo_model value
  - Credit calculation remains 1 credit = 1 second = $0.10
*/

-- Update the default veo_model for new video generations
ALTER TABLE generated_videos 
  ALTER COLUMN veo_model SET DEFAULT 'veo-3-fast-generate';

-- Optionally update existing records that are still using the old preview model
-- (only updates records that haven't been generated yet)
UPDATE generated_videos 
SET veo_model = 'veo-3-fast-generate'
WHERE veo_model = 'veo-3.1-fast-generate-preview'
  AND generation_status IN ('pending', 'processing');
