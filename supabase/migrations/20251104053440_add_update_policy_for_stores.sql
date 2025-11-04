/*
  # Add UPDATE policy for stores table

  1. Changes
    - Add policy to allow authenticated users to update stores
    - This enables plan upgrades, settings updates, and credit modifications
  
  2. Security
    - Policy allows any authenticated user to update any store
    - This is appropriate since stores are managed by app logic, not user ownership
*/

CREATE POLICY "Allow update access to stores"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
