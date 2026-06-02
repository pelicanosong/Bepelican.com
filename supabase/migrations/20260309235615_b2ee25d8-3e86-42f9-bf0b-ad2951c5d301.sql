ALTER TABLE public.experiences 
ALTER COLUMN environment_type TYPE text[] 
USING CASE 
  WHEN environment_type IS NULL THEN NULL 
  ELSE ARRAY[environment_type] 
END;