-- Add missing poi_images table for POI photo caching
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS poi_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_name TEXT NOT NULL,
  location_lat DECIMAL,
  location_lng DECIMAL,
  image_url TEXT NOT NULL,
  source TEXT NOT NULL,
  attribution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS for POI images - public cache
-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_poi_images_name ON poi_images(poi_name);
