
-- =============================================
-- 1. PERFORMANCE INDEXES on hot query paths
-- =============================================

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_experience_id ON public.order_items (experience_id) WHERE experience_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_artesania_id ON public.order_items (artesania_id) WHERE artesania_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_experience_bookings_experience_date ON public.experience_bookings (experience_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_lodging_seasons_lodging_dates ON public.lodging_seasons (lodging_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_room_season_rates_season_room ON public.room_season_rates (season_id, room_type_id);
CREATE INDEX IF NOT EXISTS idx_experience_lodgings_experience ON public.experience_lodgings (experience_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_experience ON public.pricing_rules (experience_id);

-- =============================================
-- 2. FIX FK ACTIONS: lodging refs in order_items should SET NULL
-- =============================================

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_lodging_id_fkey,
  ADD CONSTRAINT order_items_lodging_id_fkey
    FOREIGN KEY (lodging_id) REFERENCES public.lodgings(id) ON DELETE SET NULL;

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_lodging_room_type_id_fkey,
  ADD CONSTRAINT order_items_lodging_room_type_id_fkey
    FOREIGN KEY (lodging_room_type_id) REFERENCES public.lodging_room_types(id) ON DELETE SET NULL;

-- =============================================
-- 3. DROP misnamed index
-- =============================================

DROP INDEX IF EXISTS idx_experiences_featured;
