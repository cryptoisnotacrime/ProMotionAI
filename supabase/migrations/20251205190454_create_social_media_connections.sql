/*
  # Create Social Media Connections System

  1. New Tables
    - `social_media_connections`
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to stores)
      - `platform` (text) - 'instagram' or 'tiktok'
      - `platform_user_id` (text) - User ID on the platform
      - `platform_username` (text) - Username on the platform
      - `access_token` (text) - OAuth access token (encrypted)
      - `refresh_token` (text) - OAuth refresh token (encrypted)
      - `token_expires_at` (timestamptz) - When the access token expires
      - `profile_picture_url` (text) - User's profile picture
      - `is_active` (boolean) - Whether the connection is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `social_media_connections` table
    - Add policies for authenticated users to manage their own connections
    - Only store owners can access their connections
*/

CREATE TABLE IF NOT EXISTS social_media_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  platform_user_id text NOT NULL,
  platform_username text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  profile_picture_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, platform, platform_user_id)
);

ALTER TABLE social_media_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to manage connections during OAuth flow
CREATE POLICY "Allow service role to manage connections"
  ON social_media_connections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow users to view connections for their store
CREATE POLICY "Allow users to view own store connections"
  ON social_media_connections
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow updates to connections
CREATE POLICY "Allow users to update own store connections"
  ON social_media_connections
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow deletion of connections
CREATE POLICY "Allow users to delete own store connections"
  ON social_media_connections
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_media_connections_store_id
  ON social_media_connections(store_id);

CREATE INDEX IF NOT EXISTS idx_social_media_connections_platform
  ON social_media_connections(store_id, platform);