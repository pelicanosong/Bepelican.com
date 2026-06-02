-- Add upsell_priority to experiences table
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS upsell_priority integer DEFAULT 0;

-- Create destinations table for geographic grouping
CREATE TABLE IF NOT EXISTS public.destinations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text NOT NULL,
  department text,
  country text DEFAULT 'Colombia',
  nearby_destination_ids uuid[] DEFAULT ARRAY[]::uuid[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on destinations
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public read access
CREATE POLICY "Destinations are viewable by everyone" 
ON public.destinations 
FOR SELECT 
USING (true);

-- Only admins can manage destinations
CREATE POLICY "Admins can insert destinations" 
ON public.destinations 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update destinations" 
ON public.destinations 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete destinations" 
ON public.destinations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add destination_id foreign key to experiences
ALTER TABLE public.experiences 
ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES public.destinations(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_experiences_destination_id ON public.experiences(destination_id);
CREATE INDEX IF NOT EXISTS idx_experiences_upsell_priority ON public.experiences(upsell_priority);

-- Add trigger for updated_at on destinations
CREATE TRIGGER update_destinations_updated_at
BEFORE UPDATE ON public.destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();