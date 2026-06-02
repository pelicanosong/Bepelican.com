-- Add explicit denial policies for user_roles table to prevent privilege escalation
-- Role assignments should only be managed by system/admin via service role

-- Deny all client-side INSERT operations
CREATE POLICY "Role assignments managed by system only"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

-- Deny all client-side UPDATE operations
CREATE POLICY "No client updates to roles"
ON public.user_roles
FOR UPDATE
USING (false);

-- Deny all client-side DELETE operations
CREATE POLICY "No client deletes of roles"
ON public.user_roles
FOR DELETE
USING (false);