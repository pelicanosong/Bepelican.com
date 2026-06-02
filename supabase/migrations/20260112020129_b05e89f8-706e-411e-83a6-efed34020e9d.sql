-- Enable RLS on tables that need it
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_bookings ENABLE ROW LEVEL SECURITY;

-- Categories: Public read access (experiences catalog)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

-- Orders: Users manage their own orders
CREATE POLICY "Users can create own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can manage items in their own orders
CREATE POLICY "Users can create items in own orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view items in own orders" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Payments: Users can view their own payments
CREATE POLICY "Users can view own payments" 
ON public.payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = payments.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Experience Bookings: Users can view their own bookings
CREATE POLICY "Users can view own bookings" 
ON public.experience_bookings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = experience_bookings.order_item_id
    AND o.user_id = auth.uid()
  )
);