-- POI Images Cache Table
-- Stores image URLs for POIs to minimize API calls

CREATE TABLE poi_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poi_name TEXT NOT NULL, -- Normalized name (lowercase, trimmed)
  location_lat NUMERIC(10, 7), -- Optional: for location-specific images
  location_lng NUMERIC(10, 7),
  image_url TEXT NOT NULL,
  source TEXT NOT NULL, -- 'google', 'unsplash', 'flickr', 'placeholder'
  width INTEGER,
  height INTEGER,
  attribution TEXT, -- Required for Unsplash/Flickr
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poi_name, location_lat, location_lng)
);

-- Indexes for fast lookup
CREATE INDEX idx_poi_images_name ON poi_images(poi_name);
CREATE INDEX idx_poi_images_location ON poi_images(location_lat, location_lng);
CREATE INDEX idx_poi_images_source ON poi_images(source);

-- Trigger for updated_at
CREATE TRIGGER update_poi_images_updated_at BEFORE UPDATE ON poi_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE poi_images IS 'Cached POI images from various sources to minimize API calls';
COMMENT ON COLUMN poi_images.poi_name IS 'Normalized POI name (lowercase, trimmed)';
COMMENT ON COLUMN poi_images.source IS 'Image source: google, unsplash, flickr, placeholder';
