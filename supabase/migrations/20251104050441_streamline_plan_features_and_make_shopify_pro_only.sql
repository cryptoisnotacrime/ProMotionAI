/*
  # Streamline plan features and make Shopify integration Pro-only

  1. Changes
    - Reduce features to max 6 items per plan
    - Remove HD video quality, unlimited downloads, video library (assumed features)
    - Make Shopify integration (add to product) available only on Pro plan
    - Focus on key differentiators
  
  2. Updated Features
    - Free: 2 features (basic capabilities)
    - Basic: 4 features (adds advanced prompts and controls)
    - Pro: 6 features (adds priority, branding, bulk, Shopify)
*/

UPDATE subscription_plans
SET features = '["Basic AI prompts", "Standard processing"]'::jsonb
WHERE plan_name = 'free';

UPDATE subscription_plans
SET features = '["Basic AI prompts", "Advanced AI prompts", "Style customization", "Product focus control"]'::jsonb
WHERE plan_name = 'basic';

UPDATE subscription_plans
SET features = '["Advanced AI prompts", "Priority processing", "Custom branding", "Bulk generation", "Style presets", "Add to Shopify products"]'::jsonb
WHERE plan_name = 'pro';
