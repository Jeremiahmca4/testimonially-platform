-- Run this in Supabase SQL editor
-- Adds the unique constraint needed for upsert deduplication

ALTER TABLE reviews 
  ADD CONSTRAINT reviews_unique_per_restaurant 
  UNIQUE (restaurant_id, reviewer_name, review_text);
