-- Add explicit RLS policies for experience_bookings to document security model
-- Bookings can only be created by the system (webhook with service role)

-- Explicitly deny client-side INSERT (already blocked by default, but makes intent clear)
CREATE POLICY "Bookings created by system only"
ON public.experience_bookings
FOR INSERT
WITH CHECK (false);

-- Explicitly deny client-side UPDATE (already blocked by default)
CREATE POLICY "No client updates to bookings"
ON public.experience_bookings
FOR UPDATE
USING (false);

-- Explicitly deny client-side DELETE
CREATE POLICY "No client deletes of bookings"
ON public.experience_bookings
FOR DELETE
USING (false);

-- Fix the race condition: prevent users from updating orders entirely
-- Order cancellation should be handled through a dedicated RPC if needed
DROP POLICY IF EXISTS "Users can update own pending orders" ON public.orders;

-- Create a restrictive policy that prevents all user updates
-- (order status changes should happen via webhook/system only)
CREATE POLICY "Users cannot update orders"
ON public.orders
FOR UPDATE
USING (false);