-- ============================================================
-- CalendaPro CLIENT — Tables bookings, favorites, reviews
-- Exécuter dans Supabase SQL Editor
-- ============================================================

-- ── BOOKINGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          text        NOT NULL,
  pro_id             text        NOT NULL,
  pro_username       text        NOT NULL,
  pro_name           text,
  service_name       text,
  service_id         uuid,
  scheduled_at       timestamptz NOT NULL,
  duration_minutes   int,
  price              numeric(10,2),
  status             text        NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','completed','cancelled','no_show')),
  payment_status     text        NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','refunded')),
  payment_intent_id  text,
  notes              text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_client_id_idx   ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS bookings_pro_id_idx      ON public.bookings(pro_id);
CREATE INDEX IF NOT EXISTS bookings_scheduled_at_idx ON public.bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx      ON public.bookings(status);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client read own bookings" ON public.bookings;
CREATE POLICY "client read own bookings"
  ON public.bookings FOR SELECT
  USING (client_id = auth.uid()::text);

DROP POLICY IF EXISTS "pro read own bookings" ON public.bookings;
CREATE POLICY "pro read own bookings"
  ON public.bookings FOR SELECT
  USING (pro_id = auth.uid()::text);

DROP POLICY IF EXISTS "client insert own bookings" ON public.bookings;
CREATE POLICY "client insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (client_id = auth.uid()::text);

DROP POLICY IF EXISTS "client update own bookings" ON public.bookings;
CREATE POLICY "client update own bookings"
  ON public.bookings FOR UPDATE
  USING (client_id = auth.uid()::text);

-- ── FAVORITES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  client_id    text        NOT NULL,
  pro_id       text        NOT NULL,
  pro_username text        NOT NULL,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (client_id, pro_id)
);

CREATE INDEX IF NOT EXISTS favorites_client_id_idx ON public.favorites(client_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client manage own favorites" ON public.favorites;
CREATE POLICY "client manage own favorites"
  ON public.favorites FOR ALL
  USING (client_id = auth.uid()::text)
  WITH CHECK (client_id = auth.uid()::text);

-- ── REVIEWS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   text        NOT NULL,
  pro_id      text        NOT NULL,
  booking_id  uuid        REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating      int         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_pro_id_idx ON public.reviews(pro_id);
CREATE INDEX IF NOT EXISTS reviews_client_id_idx ON public.reviews(client_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read reviews" ON public.reviews;
CREATE POLICY "public read reviews"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "client insert own review" ON public.reviews;
CREATE POLICY "client insert own review"
  ON public.reviews FOR INSERT
  WITH CHECK (client_id = auth.uid()::text);

-- ── updated_at trigger for bookings ───────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
