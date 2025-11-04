/*
  # Create Business DNA System

  ## Purpose
  Store comprehensive brand identity information extracted from website and social media
  to power personalized video generation (similar to Google's Pomelli)

  ## Changes
  1. Add Business DNA fields to stores table:
     - brand_logo_url (text) - URL to brand logo
     - brand_colors (jsonb) - Array of brand colors with hex codes
     - brand_fonts (jsonb) - Primary and secondary fonts
     - brand_images (jsonb) - Array of brand image URLs
     - brand_tagline (text) - Brand tagline/slogan
     - brand_values (text[]) - Array of brand values
     - brand_aesthetic (text[]) - Brand aesthetic keywords
     - brand_tone_of_voice (text[]) - Tone of voice descriptors
     - business_overview (text) - Brief business description
     - onboarding_completed (boolean) - Whether brand DNA onboarding is done
     - brand_dna_updated_at (timestamptz) - Last time brand DNA was updated

  ## Notes
  - All fields are optional for backwards compatibility
  - JSONB allows flexible storage of complex brand data
  - This powers the "Business DNA" onboarding experience
*/

-- Add Business DNA fields to stores table
DO $$
BEGIN
  -- Brand visual identity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_logo_url'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_colors'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_colors jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_fonts'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_fonts jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_images'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_images jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Brand messaging
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_tagline'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_tagline text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_values'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_values text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_aesthetic'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_aesthetic text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_tone_of_voice'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_tone_of_voice text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'business_overview'
  ) THEN
    ALTER TABLE stores ADD COLUMN business_overview text;
  END IF;

  -- Onboarding tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE stores ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'brand_dna_updated_at'
  ) THEN
    ALTER TABLE stores ADD COLUMN brand_dna_updated_at timestamptz;
  END IF;
END $$;
