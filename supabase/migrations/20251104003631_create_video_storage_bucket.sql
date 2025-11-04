/*
  # Create Video Storage Bucket

  1. New Storage Bucket
    - `generated-videos` bucket for storing generated video files
    - Public access enabled for easy sharing and embedding
    - No file size limits to accommodate video files
  
  2. Storage Policies
    - Authenticated users can upload videos
    - Public read access for all videos
    - Authenticated users can update their own videos
    - Authenticated users can delete their own videos
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-videos', 'generated-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-videos');

-- Allow public read access
CREATE POLICY "Public can read videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'generated-videos');

-- Allow authenticated users to update their own videos
CREATE POLICY "Authenticated users can update videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'generated-videos')
WITH CHECK (bucket_id = 'generated-videos');

-- Allow authenticated users to delete their own videos
CREATE POLICY "Authenticated users can delete videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'generated-videos');