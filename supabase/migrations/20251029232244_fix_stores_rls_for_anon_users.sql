/*
  # Fix RLS policies for stores table to allow anon access

  1. Changes
    - Drop existing restrictive policies
    - Add new policies that allow anon users to read stores by shop_domain
    - Keep write operations restricted to service role only
  
  2. Security
    - Anon users can only SELECT stores (read-only)
    - Anon users can access any store (needed for OAuth flow)
    - Insert/Update remain protected and only work via service role
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Stores can view own data" ON stores;
DROP POLICY IF EXISTS "Stores can insert own data" ON stores;
DROP POLICY IF EXISTS "Stores can update own data" ON stores;

-- Allow anon and authenticated users to read stores
CREATE POLICY "Allow read access to stores"
  ON stores FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can insert/update stores
-- (Edge functions use service role key)
