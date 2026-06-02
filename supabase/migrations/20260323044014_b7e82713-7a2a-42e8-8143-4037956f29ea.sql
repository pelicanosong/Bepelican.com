-- Add first_name and last_name columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;

-- Populate from existing full_name data
UPDATE public.profiles 
SET 
  first_name = split_part(coalesce(full_name, ''), ' ', 1),
  last_name = CASE 
    WHEN position(' ' in coalesce(full_name, '')) > 0 
    THEN substring(coalesce(full_name, '') from position(' ' in coalesce(full_name, '')) + 1)
    ELSE ''
  END
WHERE first_name IS NULL;

-- Update the trigger to save first_name and last_name separately
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null),
    now(),
    now()
  );
  return new;
end;
$$;