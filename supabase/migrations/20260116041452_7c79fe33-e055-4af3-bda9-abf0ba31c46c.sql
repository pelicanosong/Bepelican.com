-- Add storage policies for experiences bucket to allow admin uploads

-- Policy: Allow public read access to experience images
CREATE POLICY "Public read access for experience images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'experiences');

-- Policy: Allow admins to upload experience images
CREATE POLICY "Admin users can upload experience images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'experiences' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Allow admins to update experience images
CREATE POLICY "Admin users can update experience images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'experiences' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Allow admins to delete experience images
CREATE POLICY "Admin users can delete experience images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'experiences' 
  AND public.has_role(auth.uid(), 'admin')
);