/*
  # Allow anonymous users to view subscription plans

  1. Changes
    - Add RLS policy to allow anonymous (unauthenticated) users to view active subscription plans
    - This is needed for the billing page to work before users complete OAuth
  
  2. Security
    - Only SELECT is allowed
    - Only active plans (is_active = true) are visible
    - No other operations allowed for anon users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Anonymous users can view active plans'
  ) THEN
    CREATE POLICY "Anonymous users can view active plans"
      ON subscription_plans
      FOR SELECT
      TO anon
      USING (is_active = true);
  END IF;
END $$;
