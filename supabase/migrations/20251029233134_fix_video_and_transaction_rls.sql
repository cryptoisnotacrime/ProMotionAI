/*
  # Fix RLS policies for video generation and transactions

  1. Changes
    - Update generated_videos table policies to allow anon users to read/write
    - Update credit_transactions table policies to allow anon users to read/write
    - Service role (edge functions) can always write via bypass
  
  2. Security
    - Anon users can manage videos and transactions
    - This is necessary since the app doesn't use authentication
    - Edge functions use service role key which bypasses RLS
*/

-- Drop existing policies for generated_videos
DROP POLICY IF EXISTS "Stores can view own videos" ON generated_videos;
DROP POLICY IF EXISTS "Stores can insert own videos" ON generated_videos;
DROP POLICY IF EXISTS "Stores can update own videos" ON generated_videos;
DROP POLICY IF EXISTS "Stores can delete own videos" ON generated_videos;

-- Drop existing policies for credit_transactions
DROP POLICY IF EXISTS "Stores can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Stores can insert own transactions" ON credit_transactions;

-- Allow anon and authenticated users to manage generated_videos
CREATE POLICY "Allow all access to generated_videos"
  ON generated_videos FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon and authenticated users to manage credit_transactions
CREATE POLICY "Allow all access to credit_transactions"
  ON credit_transactions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
