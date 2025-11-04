/*
  # Update Video Templates for E-Commerce Focus

  1. Changes
    - Update template descriptions to emphasize e-commerce and online store context
    - Add Shopify product page language
    - Focus on conversion and customer engagement
    - Maintain professional tone for product marketing

  2. Templates Updated
    - Cinematic Reveal: Now emphasizes e-commerce product showcase
    - Lifestyle Connection: Highlights customer purchase decision context
*/

-- Update Cinematic Reveal template for e-commerce focus
UPDATE video_templates
SET template_json = jsonb_set(
  template_json,
  '{description}',
  '"Generate a video for an e-commerce product page featuring {{product_name}}. This video will be displayed on a Shopify store to help customers visualize the product. Create a cinematic reveal showcasing {{product_name}} on a beautifully lit {{background_style}} background. The video should highlight the product''s key features and quality to encourage purchase decisions. Professional e-commerce aesthetic with {{tone}} style and {{lighting_mood}} lighting."'::jsonb
)
WHERE name = 'Cinematic Reveal';

-- Update Lifestyle Connection template for e-commerce focus  
UPDATE video_templates
SET template_json = jsonb_set(
  template_json,
  '{description}',
  '"Generate a video for an e-commerce product page featuring {{product_name}}. This video will be displayed on a Shopify store to help customers make informed purchase decisions. Show {{product_name}} in a warm, relatable {{background_style}} setting that demonstrates real-world use. The video should connect emotionally with online shoppers and showcase how the product fits into their lifestyle. {{tone}} presentation with {{lighting_mood}} lighting perfect for converting browsers into buyers."'::jsonb
)
WHERE name = 'Lifestyle Connection';