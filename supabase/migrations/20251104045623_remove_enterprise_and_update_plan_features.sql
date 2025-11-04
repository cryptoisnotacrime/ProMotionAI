/*
  # Remove Enterprise plan and update plan features

  1. Changes
    - Deactivate Enterprise plan (don't delete for data integrity)
    - Update plan features to focus on capabilities, not support
    - Remove API access, white label, and enterprise features
    - Fix video duration descriptions to match 4s, 6s, 8s limits
  
  2. Updated Features
    - Free: Basic video generation features
    - Basic: Advanced prompts and more control
    - Pro: Priority processing, custom branding, bulk generation
*/

UPDATE subscription_plans 
SET is_active = false 
WHERE plan_name = 'enterprise';

UPDATE subscription_plans
SET features = '["HD video quality", "Unlimited downloads", "Video library access", "Shopify integration", "Basic AI prompts"]'::jsonb
WHERE plan_name = 'free';

UPDATE subscription_plans
SET features = '["HD video quality", "Unlimited downloads", "Video library access", "Shopify integration", "Advanced AI prompts", "Style customization", "Product focus control"]'::jsonb
WHERE plan_name = 'basic';

UPDATE subscription_plans
SET features = '["HD video quality", "Unlimited downloads", "Video library access", "Shopify integration", "Advanced AI prompts", "Priority processing", "Custom branding", "Bulk generation", "Style presets", "Camera angles"]'::jsonb
WHERE plan_name = 'pro';
