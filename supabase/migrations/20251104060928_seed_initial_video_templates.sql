/*
  # Seed Initial Video Templates

  ## Purpose
  Populate the video_templates table with pre-built generic templates
  for Free, Basic, and Pro tiers.

  ## Templates Added
  1. Cinematic Reveal (Generic - All tiers)
  2. Fast-Paced Ad Burst (Generic - All tiers)
  3. Lifestyle Connection (Generic - All tiers)

  ## Notes
  - These templates use placeholders like {{product_name}}, {{tone}}, etc.
  - Templates are marked as active and available immediately
  - Free tier templates use simpler camera movements
  - Pro tier templates use advanced cinematic techniques
*/

-- Insert Generic Template 1: Cinematic Reveal
INSERT INTO video_templates (name, description, category, tier, template_json, is_active, sort_order)
VALUES (
  'Cinematic Reveal',
  'A dramatic, professional reveal showcasing your product with elegant camera movement and atmospheric lighting',
  'Generic',
  'free',
  '{
    "description": "A cinematic reveal of {{product_name}} displayed on a beautifully lit {{background_style}} background",
    "visual_style": "{{tone}} cinematic style, high realism",
    "camera": "slow dolly-in toward the product with soft parallax",
    "main_subject": "{{product_name}} centered in focus",
    "background": "{{background_style}} with depth and contrast",
    "lighting_mood": "{{lighting_mood}}",
    "audio": "background score with {{music_mood}} feel",
    "color_palette": "{{color_palette}}",
    "hook": "light flare transition revealing the product at second 1",
    "finale": "fade to {{brand_name}} logo or tagline",
    "keywords": ["cinematic", "product", "reveal", "luxury"],
    "negative_prompt": "no watermarks, no stock logos, no subtitles, no unwanted text",
    "meta": {
      "platform": "{{platform}}",
      "duration": "{{duration}}",
      "aspect_ratio": "{{platform}}",
      "tier": "{{tier}}",
      "category": "Generic"
    }
  }'::jsonb,
  true,
  1
)
ON CONFLICT DO NOTHING;

-- Insert Generic Template 2: Fast-Paced Ad Burst
INSERT INTO video_templates (name, description, category, tier, template_json, is_active, sort_order)
VALUES (
  'Fast-Paced Ad Burst',
  'High-energy, modern editing perfect for social media ads with quick cuts and dynamic motion',
  'Generic',
  'basic',
  '{
    "description": "A quick, high-energy edit showcasing {{product_name}} using {{product_image_url}} with modern aesthetics",
    "visual_style": "bold kinetic motion, modern typography overlays",
    "camera": "fast handheld pans and zooms synchronized to beat",
    "main_subject": "{{product_name}} in action shots",
    "background": "motion-blurred abstract shapes",
    "lighting_mood": "bright, vivid, high-contrast lighting",
    "audio": "{{music_mood}} rhythm with punchy transitions",
    "color_palette": "{{color_palette}}",
    "hook": "instant flash of {{product_name}} on first beat",
    "finale": "text overlay: ''Discover {{product_name}}''",
    "keywords": ["fast", "modern", "energetic"],
    "negative_prompt": "no watermarks, no stock logos, no subtitles, no unwanted text",
    "meta": {
      "platform": "{{platform}}",
      "duration": "{{duration}}",
      "aspect_ratio": "{{platform}}",
      "tier": "{{tier}}",
      "category": "Generic"
    }
  }'::jsonb,
  true,
  2
)
ON CONFLICT DO NOTHING;

-- Insert Generic Template 3: Lifestyle Connection
INSERT INTO video_templates (name, description, category, tier, template_json, is_active, sort_order)
VALUES (
  'Lifestyle Connection',
  'Warm, relatable scene showing your product in a natural lifestyle setting with human connection',
  'Generic',
  'free',
  '{
    "description": "{{product_name}} appears naturally in a {{background_style}} setting, blending seamlessly into everyday life",
    "visual_style": "warm lifestyle realism with shallow depth of field",
    "camera": "handheld follow shot transitioning to focus on the product",
    "main_subject": "a person interacting with {{product_name}}",
    "background": "{{background_style}} with natural bokeh",
    "lighting_mood": "{{lighting_mood}}",
    "audio": "{{music_mood}} track with ambient background sounds",
    "color_palette": "{{color_palette}}",
    "hook": "motion starts with human interaction at second 0",
    "finale": "close-up of {{product_name}} in focus, logo fade",
    "keywords": ["lifestyle", "natural", "warm"],
    "negative_prompt": "no watermarks, no stock logos, no subtitles, no unwanted text",
    "meta": {
      "platform": "{{platform}}",
      "duration": "{{duration}}",
      "aspect_ratio": "{{platform}}",
      "tier": "{{tier}}",
      "category": "Generic"
    }
  }'::jsonb,
  true,
  3
)
ON CONFLICT DO NOTHING;

-- Insert Pro Template 1: Luxury Showcase
INSERT INTO video_templates (name, description, category, tier, template_json, is_active, sort_order)
VALUES (
  'Luxury Showcase',
  'Premium, high-end product showcase with sophisticated camera work and elegant transitions',
  'Generic',
  'pro',
  '{
    "description": "An elegant, premium showcase of {{product_name}} with sophisticated cinematography and luxurious atmosphere",
    "visual_style": "{{tone}} high-end commercial style with perfect lighting",
    "camera": "{{camera_motion}} with smooth gimbal movements",
    "main_subject": "{{product_name}} as the hero element with perfect composition",
    "background": "{{background_style}} with dramatic depth and premium aesthetics",
    "lighting_mood": "{{lighting_mood}} with professional three-point lighting",
    "audio": "{{music_mood}} orchestral score with subtle sound design",
    "color_palette": "{{color_palette}} with rich, saturated tones",
    "hook": "dramatic light reveal at second 0 drawing eye to product",
    "finale": "{{brand_name}} signature moment with {{final_call_to_action}}",
    "keywords": ["luxury", "premium", "sophisticated", "cinematic"],
    "negative_prompt": "no watermarks, no stock logos, no subtitles, no unwanted text",
    "voice_over": "{{voice_over}}",
    "voice_description": "{{voice_description}}",
    "custom_notes": "{{custom_notes}}",
    "meta": {
      "platform": "{{platform}}",
      "duration": "{{duration}}",
      "aspect_ratio": "{{platform}}",
      "tier": "{{tier}}",
      "category": "Generic"
    }
  }'::jsonb,
  true,
  4
)
ON CONFLICT DO NOTHING;

-- Insert Pro Template 2: Product Story
INSERT INTO video_templates (name, description, category, tier, template_json, is_active, sort_order)
VALUES (
  'Product Story',
  'Narrative-driven video that tells the story behind your product with emotional connection',
  'Generic',
  'pro',
  '{
    "description": "A compelling narrative journey featuring {{product_name}}, showing its creation, benefits, and emotional impact",
    "visual_style": "{{tone}} documentary-style cinematography with editorial pacing",
    "camera": "{{camera_motion}} with intentional framing and composition",
    "main_subject": "{{product_name}} shown through various contexts and use cases",
    "background": "{{background_style}} transitioning between scenes",
    "lighting_mood": "{{lighting_mood}} adapting to story beats",
    "audio": "{{music_mood}} building emotional arc",
    "color_palette": "{{color_palette}} with color grading enhancing mood",
    "hook": "compelling opening scene establishing context",
    "finale": "{{final_call_to_action}} with {{brand_name}} reveal",
    "keywords": ["story", "narrative", "emotional", "journey"],
    "negative_prompt": "no watermarks, no stock logos, no subtitles, no unwanted text",
    "voice_over": "{{voice_over}}",
    "voice_description": "{{voice_description}}",
    "custom_notes": "{{custom_notes}}",
    "meta": {
      "platform": "{{platform}}",
      "duration": "{{duration}}",
      "aspect_ratio": "{{platform}}",
      "tier": "{{tier}}",
      "category": "Generic"
    }
  }'::jsonb,
  true,
  5
)
ON CONFLICT DO NOTHING;
