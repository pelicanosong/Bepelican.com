-- Add policy to allow public read of bookings for availability calculation
-- This is safe because experience_bookings doesn't contain PII directly
CREATE POLICY "Public can view bookings for availability" 
ON public.experience_bookings 
FOR SELECT 
USING (true);