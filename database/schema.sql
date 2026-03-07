-- ============================================================
-- Testimonially — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── RESTAURANTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT         NOT NULL,
  logo_url        TEXT,
  google_maps_url TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── REVIEWS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID         NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  reviewer_name   TEXT         NOT NULL,
  rating          INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text     TEXT         NOT NULL,
  review_date     TEXT,
  source          TEXT         NOT NULL DEFAULT 'google',
  scraped_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── TESTIMONIALS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id       UUID         NOT NULL REFERENCES reviews(id)      ON DELETE CASCADE,
  restaurant_id   UUID         NOT NULL REFERENCES restaurants(id)   ON DELETE CASCADE,
  user_id         UUID         NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  saved_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id     ON restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id   ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating          ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id    ON testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_restaurant ON testimonials(restaurant_id);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON restaurants;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE restaurants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Restaurants: owner CRUD
CREATE POLICY "owner_select_restaurants" ON restaurants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_restaurants" ON restaurants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_update_restaurants" ON restaurants
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner_delete_restaurants" ON restaurants
  FOR DELETE USING (auth.uid() = user_id);

-- Reviews: readable by owner; scraper inserts via service_role (bypasses RLS)
CREATE POLICY "owner_select_reviews" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = reviews.restaurant_id
        AND restaurants.user_id = auth.uid()
    )
  );
CREATE POLICY "service_insert_reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Testimonials: owner CRUD
CREATE POLICY "owner_select_testimonials" ON testimonials
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert_testimonials" ON testimonials
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_delete_testimonials" ON testimonials
  FOR DELETE USING (auth.uid() = user_id);
