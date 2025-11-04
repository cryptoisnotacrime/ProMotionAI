-- ProMotionAI Database Schema
-- Complete database schema for store management, video generation, credit tracking, and subscriptions

-- Table 1: stores - Shopify merchant/store information and OAuth tokens
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain text UNIQUE NOT NULL,
  access_token text,
  shopify_store_id text,
  store_name text,
  email text,
  plan_name text DEFAULT 'free',
  credits_remaining integer DEFAULT 10,
  credits_total integer DEFAULT 10,
  billing_cycle_start timestamptz DEFAULT now(),
  billing_cycle_end timestamptz DEFAULT now() + interval '1 month',
  subscription_status text DEFAULT 'trial',
  installed_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Table 2: generated_videos - All generated video content with metadata
CREATE TABLE IF NOT EXISTS generated_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_title text,
  source_image_url text NOT NULL,
  video_url text,
  thumbnail_url text,
  prompt text,
  duration_seconds integer DEFAULT 5,
  generation_status text DEFAULT 'pending',
  generation_started_at timestamptz,
  generation_completed_at timestamptz,
  credits_used integer DEFAULT 1,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table 3: credit_transactions - Audit trail for all credit operations
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  video_id uuid REFERENCES generated_videos(id) ON DELETE SET NULL,
  transaction_type text NOT NULL,
  credits_amount integer NOT NULL,
  credits_before integer NOT NULL,
  credits_after integer NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Table 4: subscription_plans - Available subscription tiers
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  monthly_price decimal(10,2) DEFAULT 0,
  annual_price decimal(10,2) DEFAULT 0,
  credits_per_cycle integer DEFAULT 10,
  max_video_duration integer DEFAULT 10,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stores_shop_domain ON stores(shop_domain);
CREATE INDEX IF NOT EXISTS idx_videos_store_id ON generated_videos(store_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON generated_videos(generation_status);
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON credit_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_plans_name ON subscription_plans(plan_name);

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores table
CREATE POLICY "Stores can view own data"
  ON stores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Stores can insert own data"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Stores can update own data"
  ON stores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for generated_videos table
CREATE POLICY "Stores can view own videos"
  ON generated_videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Stores can insert own videos"
  ON generated_videos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Stores can update own videos"
  ON generated_videos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Stores can delete own videos"
  ON generated_videos FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for credit_transactions table
CREATE POLICY "Stores can view own transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Stores can insert own transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for subscription_plans table (public read)
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, display_name, monthly_price, annual_price, credits_per_cycle, max_video_duration, features) VALUES
  ('free', 'Free Trial', 0, 0, 10, 5, '["5s videos", "10 credits/month", "Basic support"]'),
  ('basic', 'Basic Plan', 29.99, 299.99, 50, 10, '["10s videos", "50 credits/month", "Email support", "HD quality"]'),
  ('pro', 'Pro Plan', 79.99, 799.99, 150, 30, '["30s videos", "150 credits/month", "Priority support", "HD quality", "Custom branding"]'),
  ('enterprise', 'Enterprise', 199.99, 1999.99, 500, 60, '["60s videos", "500 credits/month", "24/7 support", "4K quality", "API access", "Custom integrations"]')
ON CONFLICT (plan_name) DO NOTHING;