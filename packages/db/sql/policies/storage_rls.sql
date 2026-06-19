-- 006_storage.sql
-- Supabase Storage bucket for file uploads.
-- Run this in the Supabase SQL editor.

-- Create storage bucket (via Supabase dashboard or SQL)
-- Bucket name: chat-uploads
-- Public: false (authenticated access only)

-- RLS policy for storage.objects
CREATE POLICY "Users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-uploads');

CREATE POLICY "Users can read uploaded files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-uploads');
