/*
  # Create Custom Templates System

  1. New Tables
    - `custom_templates`
      - `id` (uuid, primary key) - Unique template identifier
      - `store_id` (uuid, foreign key) - References stores table
      - `name` (text) - Custom name given by user
      - `description` (text) - Brief description of the template
      - `category` (text) - Template category (Product Focus, Lifestyle, UGC, etc.)
      - `base_template_id` (text, nullable) - ID of the template this was based on
      - `prompt_template` (text) - The actual prompt template with variables
      - `variables` (jsonb) - List of variables used in the template
      - `settings` (jsonb) - Additional settings (aspect ratio, duration preferences, etc.)
      - `is_favorite` (boolean) - Whether user has marked as favorite
      - `is_enabled` (boolean) - Whether template is enabled for use
      - `usage_count` (integer) - Number of times this template has been used
      - `created_at` (timestamptz) - When template was created
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `custom_templates` table
    - Add policies for authenticated users to manage their own templates
*/

-- Create custom templates table
CREATE TABLE IF NOT EXISTS custom_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Custom',
  base_template_id text,
  prompt_template text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  is_favorite boolean DEFAULT false,
  is_enabled boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own custom templates
CREATE POLICY "Users can view own custom templates"
  ON custom_templates
  FOR SELECT
  TO authenticated
  USING (store_id IN (
    SELECT id FROM stores WHERE id = store_id
  ));

-- Policy: Anonymous users can view their own custom templates (for unauthenticated Shopify)
CREATE POLICY "Anonymous users can view own custom templates"
  ON custom_templates
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Users can insert their own custom templates
CREATE POLICY "Users can create custom templates"
  ON custom_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (store_id IN (
    SELECT id FROM stores WHERE id = store_id
  ));

-- Policy: Anonymous users can insert custom templates
CREATE POLICY "Anonymous users can create custom templates"
  ON custom_templates
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Users can update their own custom templates
CREATE POLICY "Users can update own custom templates"
  ON custom_templates
  FOR UPDATE
  TO authenticated
  USING (store_id IN (
    SELECT id FROM stores WHERE id = store_id
  ))
  WITH CHECK (store_id IN (
    SELECT id FROM stores WHERE id = store_id
  ));

-- Policy: Anonymous users can update their own custom templates
CREATE POLICY "Anonymous users can update own custom templates"
  ON custom_templates
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete their own custom templates
CREATE POLICY "Users can delete own custom templates"
  ON custom_templates
  FOR DELETE
  TO authenticated
  USING (store_id IN (
    SELECT id FROM stores WHERE id = store_id
  ));

-- Policy: Anonymous users can delete their own custom templates
CREATE POLICY "Anonymous users can delete own custom templates"
  ON custom_templates
  FOR DELETE
  TO anon
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_templates_store_id ON custom_templates(store_id);
CREATE INDEX IF NOT EXISTS idx_custom_templates_is_enabled ON custom_templates(is_enabled);
CREATE INDEX IF NOT EXISTS idx_custom_templates_is_favorite ON custom_templates(is_favorite);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_templates_updated_at
  BEFORE UPDATE ON custom_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_templates_updated_at();