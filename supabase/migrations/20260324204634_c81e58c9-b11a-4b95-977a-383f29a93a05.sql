
-- Tabla de temporadas por hospedaje
CREATE TABLE public.lodging_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lodging_id uuid NOT NULL REFERENCES public.lodgings(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla de tarifas por tipo de habitación + temporada
CREATE TABLE public.room_season_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id uuid NOT NULL REFERENCES public.lodging_room_types(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.lodging_seasons(id) ON DELETE CASCADE,
  pricing_mode text NOT NULL DEFAULT 'per_room' CHECK (pricing_mode IN ('per_room', 'per_person')),
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_type_id, season_id)
);

-- RLS lodging_seasons
ALTER TABLE public.lodging_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lodging seasons"
  ON public.lodging_seasons FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view lodging seasons"
  ON public.lodging_seasons FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS room_season_rates
ALTER TABLE public.room_season_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage room season rates"
  ON public.room_season_rates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view room season rates"
  ON public.room_season_rates FOR SELECT
  TO anon, authenticated
  USING (true);

-- RPC: Calcula precios del calendario para un hospedaje/habitación
CREATE OR REPLACE FUNCTION public.get_lodging_calendar_prices(
  _lodging_id uuid,
  _room_type_id uuid,
  _start_date date,
  _end_date date,
  _guests integer
)
RETURNS TABLE(
  calendar_date date,
  season_name text,
  pricing_mode text,
  price_per_night numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  /*
    Para cada fecha en el rango:
    1. Busca la temporada del hospedaje donde start_date <= fecha <= end_date
    2. Busca la tarifa en room_season_rates para ese room_type + season
    3. Calcula precio:
       - per_room: price directo
       - per_person: price × _guests (validando contra capacity)
    4. Fechas sin match se omiten → el frontend las bloquea
  */
  SELECT
    d.dt::date AS calendar_date,
    ls.name AS season_name,
    rsr.pricing_mode,
    CASE
      WHEN rsr.pricing_mode = 'per_person' THEN
        rsr.price * LEAST(_guests, lrt.capacity)
      ELSE
        rsr.price
    END AS price_per_night
  FROM generate_series(_start_date, _end_date, '1 day'::interval) AS d(dt)
  INNER JOIN lodging_seasons ls
    ON ls.lodging_id = _lodging_id
    AND d.dt::date BETWEEN ls.start_date AND ls.end_date
  INNER JOIN room_season_rates rsr
    ON rsr.season_id = ls.id
    AND rsr.room_type_id = _room_type_id
  INNER JOIN lodging_room_types lrt
    ON lrt.id = _room_type_id
  WHERE rsr.price > 0;
$$;
