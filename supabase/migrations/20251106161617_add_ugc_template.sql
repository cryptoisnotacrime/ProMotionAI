/*
  # Add UGC Video Template

  1. New Template
    - Adds UGC (User Generated Content) style template
    - This is a cornerstone template focusing on authentic, relatable content
    - Ideal for social media and building trust with customers

  2. Details
    - Lifestyle-focused with natural settings
    - Emphasizes authenticity and real-world use
    - Perfect for TikTok, Instagram Reels, and social commerce
*/

INSERT INTO video_templates (
  name,
  description,
  category,
  tier,
  template_json,
  is_active,
  sort_order
) VALUES (
  'UGC Lifestyle',
  'Authentic user-generated content style showcasing your product in real-world use. Natural, relatable scenes that build trust and drive conversions through genuine presentation.',
  'Generic',
  'free',
  '{
    "description": "Authentic UGC-style video featuring {{product_name}} in real-world use with natural, relatable presentation",
    "meta": {
      "tier": "{{tier}}",
      "category": "Generic",
      "duration": "{{duration}}",
      "platform": "{{platform}}",
      "aspect_ratio": "{{platform}}"
    },
    "keywords": ["authentic", "ugc", "lifestyle", "natural", "relatable"],
    "main_subject": "{{product_name}} being used naturally in everyday life",
    "background": "{{background_style}} natural environment - home, outdoors, or casual setting",
    "visual_style": "{{tone}} handheld UGC aesthetic with authentic, unpolished feel",
    "lighting_mood": "natural {{lighting_mood}} lighting that feels real and uncontrived",
    "camera": "handheld {{camera_motion}} with slight natural shake for authenticity",
    "hook": "immediate relatable moment showing product in use",
    "color_palette": "{{color_palette}} natural tones with realistic color grading",
    "audio": "{{music_mood}} casual background music or natural ambient sounds",
    "finale": "genuine recommendation with {{final_call_to_action}}",
    "custom_notes": "{{custom_notes}}",
    "negative_prompt": "no overproduction, no studio polish, no fake scenarios, no watermarks"
  }'::jsonb,
  true,
  1
);