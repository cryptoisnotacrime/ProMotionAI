/*
  # Add Shopify Billing Schema

  1. New Columns on stores table
    - `shopify_subscription_id` (text) - Shopify recurring charge ID
    - `subscription_confirmed_at` (timestamptz) - When merchant confirmed subscription
    - `usage_capped_amount` (numeric) - Maximum usage charges per billing cycle
    
  2. New Tables
    - `usage_charges`
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to stores)
      - `video_id` (uuid, foreign key to generated_videos)
      - `charge_amount` (numeric) - Amount charged in USD
      - `charge_description` (text) - Description of the charge
      - `shopify_charge_id` (text) - Shopify's charge ID
      - `charged_at` (timestamptz) - When charge was created
      
  3. Security
    - Enable RLS on usage_charges table
    - Only stores can view their own usage charges
    
  4. Important Notes
    - Usage charges are created per video generation
    - Rates vary by plan: Free ($0.50), Basic ($0.30), Pro ($0.20) per second
    - Usage is capped at $100 per billing cycle by default
*/

-- Add billing columns to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS shopify_subscription_id text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_confirmed_at timestamptz;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS usage_capped_amount numeric DEFAULT 100.00;

-- Create usage charges table
CREATE TABLE IF NOT EXISTS usage_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  video_id uuid REFERENCES generated_videos(id) ON DELETE SET NULL,
  charge_amount numeric NOT NULL,
  charge_description text,
  shopify_charge_id text,
  charged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE usage_charges ENABLE ROW LEVEL SECURITY;

-- Usage charges policy
CREATE POLICY "Store owns usage charges" ON usage_charges
  FOR ALL TO anon, authenticated
  USING (
    store_id IN (
      SELECT id FROM stores 
      WHERE shop_domain = COALESCE(
        current_setting('request.headers', true)::json->>'x-shopify-shop',
        current_setting('request.jwt.claims', true)::json->>'shop'
      )
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores 
      WHERE shop_domain = COALESCE(
        current_setting('request.headers', true)::json->>'x-shopify-shop',
        current_setting('request.jwt.claims', true)::json->>'shop'
      )
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_usage_charges_store_id ON usage_charges(store_id);
CREATE INDEX IF NOT EXISTS idx_usage_charges_video_id ON usage_charges(video_id);
CREATE INDEX IF NOT EXISTS idx_usage_charges_charged_at ON usage_charges(charged_at DESC);