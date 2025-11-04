/*
  # Add contact email to stores table

  1. Changes
    - Add `contact_email` column to `stores` table
    - Nullable text field for user contact information
  
  2. Purpose
    - Store user contact email for billing notifications
    - Used in settings page
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE stores ADD COLUMN contact_email text;
  END IF;
END $$;
