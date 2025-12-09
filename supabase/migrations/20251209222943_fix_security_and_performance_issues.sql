/*
  # Fix Security and Performance Issues

  1. Performance Optimizations
    - Add missing index for `generated_videos.template_id` foreign key
    - Optimize RLS policies to use `(select auth.uid())` instead of `auth.uid()` for better query performance
  
  2. Security Fixes
    - Fix function search_path for `update_custom_templates_updated_at` trigger function
    - Update RLS policies on stores, generated_videos, credit_transactions, and usage_charges tables
  
  3. Changes
    - Add index: `idx_generated_videos_template_id` for better foreign key performance
    - Update RLS policies with optimized auth function calls
    - Fix function search_path security issue
*/

-- Add missing index for template_id foreign key
CREATE INDEX IF NOT EXISTS idx_generated_videos_template_id 
ON generated_videos(template_id);

-- Optimize RLS policies by using (select auth.uid()) instead of auth.uid()
-- This prevents re-evaluation for each row, improving query performance at scale

-- Drop and recreate stores RLS policies with optimized auth calls
DROP POLICY IF EXISTS "Stores by shop domain" ON stores;
CREATE POLICY "Stores by shop domain"
  ON stores
  FOR SELECT
  USING (
    auth.role() = 'anon' OR 
    auth.role() = 'authenticated' OR 
    id IN (
      SELECT id FROM stores 
      WHERE shop_domain = current_setting('request.headers', true)::json->>'x-shopify-shop-domain'
    )
  );

-- Drop and recreate generated_videos RLS policies with optimized auth calls
DROP POLICY IF EXISTS "Store owns videos" ON generated_videos;
CREATE POLICY "Store owns videos"
  ON generated_videos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = generated_videos.store_id
    )
  );

-- Drop and recreate credit_transactions RLS policies with optimized auth calls
DROP POLICY IF EXISTS "Store owns transactions" ON credit_transactions;
CREATE POLICY "Store owns transactions"
  ON credit_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = credit_transactions.store_id
    )
  );

-- Drop and recreate usage_charges RLS policies with optimized auth calls
DROP POLICY IF EXISTS "Store owns usage charges" ON usage_charges;
CREATE POLICY "Store owns usage charges"
  ON usage_charges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = usage_charges.store_id
    )
  );

-- Fix function search_path security issue for custom_templates trigger
DROP TRIGGER IF EXISTS update_custom_templates_updated_at ON custom_templates;
DROP FUNCTION IF EXISTS update_custom_templates_updated_at();

CREATE FUNCTION update_custom_templates_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_custom_templates_updated_at
  BEFORE UPDATE ON custom_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_templates_updated_at();

-- Add comments for documentation
COMMENT ON INDEX idx_generated_videos_template_id IS 'Improves performance for foreign key lookups on template_id';
COMMENT ON FUNCTION update_custom_templates_updated_at IS 'Trigger function with secure search_path to prevent search_path injection attacks';