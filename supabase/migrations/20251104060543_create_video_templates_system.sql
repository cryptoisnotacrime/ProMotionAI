/*
  # Create Video Templates System

  ## Purpose
  Store dynamic JSON video prompt templates that can be populated with user inputs
  to generate studio-grade cinematic prompts for VEO 3.1 video generation.

  ## New Tables

  ### `video_templates`
  Stores pre-authored prompt templates with placeholders for dynamic content.
  - `id` (uuid, primary key) - Unique template identifier
  - `name` (text) - Template display name (e.g., "Cinematic Reveal", "Fast-Paced Ad Burst")
  - `description` (text) - Brief description of template style and use case
  - `category` (text) - Template category (e.g., "Generic", "Fashion", "Tech", "Food")
  - `tier` (text) - Access tier: "free", "basic", or "pro"
  - `template_json` (jsonb) - The template structure with placeholders like {{product_name}}
  - `preview_image_url` (text, optional) - Preview image showing template style
  - `is_active` (boolean) - Whether template is available for use
  - `sort_order` (integer) - Display order in UI
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `video_templates` table
  - Allow all authenticated users to read active templates
  - Only system can insert/update templates (for now)

  ## Indexes
  - Index on `tier` for filtering by subscription level
  - Index on `category` for grouping templates
  - Index on `is_active` for quick filtering
*/

-- Create video_templates table
CREATE TABLE IF NOT EXISTS video_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Generic',
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro')),
  template_json jsonb NOT NULL,
  preview_image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read active templates appropriate for their tier
CREATE POLICY "Users can view active templates"
  ON video_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Allow anonymous users to view templates (for browsing before signup)
CREATE POLICY "Anonymous can view active templates"
  ON video_templates
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_templates_tier ON video_templates(tier);
CREATE INDEX IF NOT EXISTS idx_video_templates_category ON video_templates(category);
CREATE INDEX IF NOT EXISTS idx_video_templates_active ON video_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_video_templates_sort ON video_templates(sort_order);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_video_templates_timestamp
  BEFORE UPDATE ON video_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_video_templates_updated_at();
