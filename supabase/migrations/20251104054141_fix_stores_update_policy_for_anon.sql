/*
  # Fix stores UPDATE policy to allow anon users

  1. Changes
    - Drop the existing UPDATE policy that only allows authenticated users
    - Create a new UPDATE policy that allows both anon and authenticated users
  
  2. Security
    - This is necessary because the app uses the anon key, not authenticated sessions
    - All stores operations are performed using the anon key
*/

DROP POLICY IF EXISTS "Allow update access to stores" ON stores;

CREATE POLICY "Allow update access to stores"
  ON stores
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
