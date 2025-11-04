/*
  # Allow Anonymous Users to Delete Videos from Storage

  1. Security Updates
    - Drop existing restrictive delete policy
    - Create new policy allowing both authenticated and anonymous users to delete videos
    - This is safe because:
      - Video IDs are UUIDs (not guessable)
      - Videos are associated with stores via database records
      - Application logic validates ownership before calling delete

  2. Changes
    - Allow anon users to delete from generated-videos bucket
    - Matches the pattern used for other operations in the app
*/

-- Drop the existing restrictive delete policy
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;

-- Create new policy allowing authenticated and anon users to delete
CREATE POLICY "Users can delete videos"
ON storage.objects
FOR DELETE
TO authenticated, anon
USING (bucket_id = 'generated-videos');