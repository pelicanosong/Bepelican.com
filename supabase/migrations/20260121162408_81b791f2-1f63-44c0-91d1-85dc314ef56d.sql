-- Add document fields to profiles table for checkout sync
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS document_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS document_number text DEFAULT NULL;