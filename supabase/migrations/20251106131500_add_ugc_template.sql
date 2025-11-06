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
  base_prompt_template,
  example_output,
  is_active
) VALUES (
  'UGC Lifestyle',
  'Authentic user-generated content style showcasing your product in real-world use. Natural, relatable scenes that build trust and drive conversions through genuine presentation.',
  'lifestyle',
  'free',
  'Create an authentic, user-generated content style video featuring {{product_name}}. Show the product in a natural, everyday setting with realistic lighting. The scene should feel genuine and relatable, as if filmed by a real customer. Focus on the product''s practical use and benefits. Style: {{tone}}, Background: {{background_style}}, Lighting: natural {{lighting_mood}}, Camera: handheld {{camera_motion}} for authenticity, Platform: {{platform}}.',
  'A hand-held video showing someone naturally using the product in their daily routine, with soft natural lighting and an authentic, unpolished aesthetic that feels real and trustworthy.',
  true
);
