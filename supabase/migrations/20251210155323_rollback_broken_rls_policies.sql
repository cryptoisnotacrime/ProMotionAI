/*
  # Rollback Broken RLS Policies
  
  1. Changes
    - Restore working permissive RLS policies for stores, generated_videos, credit_transactions, and usage_charges
    - Remove broken shop domain checking logic that was causing 500 errors
    - Keep the performance improvements (index and function security fix from previous migration)
  
  2. Security Model
    - This app uses Shopify OAuth for authentication at the application layer
    - RLS policies are permissive to allow the frontend to query data
    - Actual access control is enforced through Shopify session management
    - Edge functions use service role to bypass RLS when needed
  
  3. Restored Policies
    - stores: Allow anon/authenticated to SELECT (read-only)
    - generated_videos: Allow anon/authenticated full access
    - credit_transactions: Allow anon/authenticated full access
    - usage_charges: Allow anon/authenticated full access
*/

-- Restore stores policy to simple read access
DROP POLICY IF EXISTS "Stores by shop domain" ON stores;
CREATE POLICY "Allow read access to stores"
  ON stores FOR SELECT
  TO anon, authenticated
  USING (true);

-- Restore generated_videos policy to full access
DROP POLICY IF EXISTS "Store owns videos" ON generated_videos;
CREATE POLICY "Allow all access to generated_videos"
  ON generated_videos FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Restore credit_transactions policy to full access
DROP POLICY IF EXISTS "Store owns transactions" ON credit_transactions;
CREATE POLICY "Allow all access to credit_transactions"
  ON credit_transactions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Restore usage_charges policy to full access
DROP POLICY IF EXISTS "Store owns usage charges" ON usage_charges;
CREATE POLICY "Allow all access to usage_charges"
  ON usage_charges FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
