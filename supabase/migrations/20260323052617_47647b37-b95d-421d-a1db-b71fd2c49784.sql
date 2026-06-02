-- Add artesania support to order_items
ALTER TABLE public.order_items 
  ALTER COLUMN experience_id DROP NOT NULL,
  ADD COLUMN artesania_id uuid REFERENCES public.artesanias(id) ON DELETE SET NULL,
  ADD COLUMN artesania_variante_id uuid REFERENCES public.artesania_variantes(id) ON DELETE SET NULL;

-- Add shipping fields to orders
ALTER TABLE public.orders
  ADD COLUMN shipping_address text,
  ADD COLUMN shipping_city text,
  ADD COLUMN shipping_department text,
  ADD COLUMN shipping_notes text,
  ADD COLUMN order_type text NOT NULL DEFAULT 'experience';

-- Add check constraint: either experience_id or artesania_id must be set
ALTER TABLE public.order_items
  ADD CONSTRAINT order_item_has_product CHECK (experience_id IS NOT NULL OR artesania_id IS NOT NULL);