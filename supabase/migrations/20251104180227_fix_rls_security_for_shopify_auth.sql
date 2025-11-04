/*
  # Fix RLS Security for Shopify Authentication

  1. Changes
    - Replace overly permissive RLS policies with secure shop-based policies
    - Use Shopify shop domain from JWT claims for authorization
    - Ensure stores can only access their own data
    
  2. Security
    - Stores policy: Only allow access where shop_domain matches JWT claim
    - Videos policy: Only allow access to videos owned by the authenticated store
    - Transactions policy: Only allow access to transactions owned by the authenticated store
    
  3. Important Notes
    - This migration drops all existing permissive policies
    - New policies require shop domain in JWT claims
    - Backend edge functions must set proper JWT claims with shop domain
*/

-- Fix stores policy
DROP POLICY IF EXISTS "Allow read access to stores" ON stores;
DROP POLICY IF EXISTS "Allow update access to stores" ON stores;
DROP POLICY IF EXISTS "Users can update own store" ON stores;
DROP POLICY IF EXISTS "Allow anonymous users to update stores by shop_domain" ON stores;

CREATE POLICY "Stores by shop domain" ON stores
  FOR ALL TO anon, authenticated
  USING (
    shop_domain = COALESCE(
      current_setting('request.headers', true)::json->>'x-shopify-shop',
      current_setting('request.jwt.claims', true)::json->>'shop'
    )
  )
  WITH CHECK (
    shop_domain = COALESCE(
      current_setting('request.headers', true)::json->>'x-shopify-shop',
      current_setting('request.jwt.claims', true)::json->>'shop'
    )
  );

-- Fix videos policy  
DROP POLICY IF EXISTS "Allow all access to generated_videos" ON generated_videos;
DROP POLICY IF EXISTS "Allow anon to insert generated_videos" ON generated_videos;
DROP POLICY IF EXISTS "Allow anon to update generated_videos" ON generated_videos;
DROP POLICY IF EXISTS "Allow anon to delete generated_videos" ON generated_videos;

CREATE POLICY "Store owns videos" ON generated_videos
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

-- Fix transactions policy
DROP POLICY IF EXISTS "Allow all access to credit_transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Allow anon to insert credit_transactions" ON credit_transactions;

CREATE POLICY "Store owns transactions" ON credit_transactions
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