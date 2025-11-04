/*
  # Add Video Attachment Status Tracking

  1. Changes to `generated_videos` table
    - Add `attached_to_product` boolean to track if video is live on Shopify product
    - Add `shopify_media_id` to store the Shopify media GID for management
  
  2. Important Notes
    - Videos can be generated and saved without being attached to product
    - Users can review and decide whether to publish to their store
    - attached_to_product = false means saved in library only
    - attached_to_product = true means live on Shopify product page
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_videos' AND column_name = 'attached_to_product'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN attached_to_product boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_videos' AND column_name = 'shopify_media_id'
  ) THEN
    ALTER TABLE generated_videos ADD COLUMN shopify_media_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_generated_videos_attached 
ON generated_videos(attached_to_product) 
WHERE attached_to_product = false;