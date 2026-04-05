-- Wahgola Database Schema for Supabase

-- Users table (synced from Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  cover_image TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Users can only access their own trips
CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = trips.user_id
      AND users.supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = trips.user_id
      AND users.supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = trips.user_id
      AND users.supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = trips.user_id
      AND users.supabase_user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_updated_at ON trips(updated_at DESC);

-- Sync metadata table (for conflict resolution)
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  sync_version INTEGER DEFAULT 1,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, device_id)
);

-- Enable Row Level Security
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sync metadata
CREATE POLICY "Users can view own sync metadata" ON sync_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = sync_metadata.user_id
      AND users.supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own sync metadata" ON sync_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = sync_metadata.user_id
      AND users.supabase_user_id = auth.uid()
    )
  );

-- POI images cache table
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
-- But we'll create an index for fast lookups
CREATE INDEX IF NOT EXISTS idx_poi_images_name ON poi_images(poi_name);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_metadata_updated_at BEFORE UPDATE ON sync_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
