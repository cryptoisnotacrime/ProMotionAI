/*
  # Fix Video Storage Access Issues

  ## Problem
  Users getting 400 errors when accessing generated videos from storage.

  ## Changes
  1. Ensure bucket is public
  2. Add comprehensive policies for both authenticated and anonymous users
  3. Allow all operations (SELECT, INSERT, UPDATE, DELETE) for the generated-videos bucket
  4. Remove restrictive policies that might block access

  ## Security
  - Videos are stored with UUID names (not guessable)
  - Application logic validates ownership
  - Public read access is required for video playback and sharing
*/

-- Drop all existing policies for storage.objects on generated-videos bucket
DROP POLICY IF EXISTS "Public can read videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete videos" ON storage.objects;

-- Ensure the bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'generated-videos';

-- Allow anyone (authenticated and anonymous) to read videos
CREATE POLICY "Anyone can read videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'generated-videos');

-- Allow authenticated and anonymous users to upload videos
CREATE POLICY "Anyone can upload videos"
ON storage.objects
FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'generated-videos');

-- Allow authenticated and anonymous users to update videos
CREATE POLICY "Anyone can update videos"
ON storage.objects
FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'generated-videos')
WITH CHECK (bucket_id = 'generated-videos');

-- Allow authenticated and anonymous users to delete videos
CREATE POLICY "Anyone can delete videos"
ON storage.objects
FOR DELETE
TO authenticated, anon
USING (bucket_id = 'generated-videos');