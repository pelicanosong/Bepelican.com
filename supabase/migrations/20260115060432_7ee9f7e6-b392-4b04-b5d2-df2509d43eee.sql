-- Add explicit RLS policies to deny client-side modifications to payments
-- Payments must be created via edge functions with service role

-- Deny all client-side INSERT to payments
CREATE POLICY "Payments created by system only"
ON public.payments
FOR INSERT
WITH CHECK (false);

-- Deny all client-side UPDATE to payments
CREATE POLICY "No client updates to payments"
ON public.payments
FOR UPDATE
USING (false);

-- Deny all client-side DELETE to payments
CREATE POLICY "No client deletes of payments"
ON public.payments
FOR DELETE
USING (false);