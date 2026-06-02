-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Admin policies for experiences table
CREATE POLICY "Admins can view all experiences"
ON public.experiences FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert experiences"
ON public.experiences FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update experiences"
ON public.experiences FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete experiences"
ON public.experiences FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));