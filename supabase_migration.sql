-- Wahgola Supabase Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  cover_image TEXT,
  data JSONB NOT NULL, -- Complete trip data including days/activities
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_updated_at ON trips(updated_at);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination);

-- Sync metadata table (for conflict resolution)
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_version INTEGER DEFAULT 1,
  UNIQUE(trip_id, device_id)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = supabase_user_id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = supabase_user_id);

-- RLS Policies for trips table
CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text));

CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text));

CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text));

CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text));

-- RLS Policies for sync_metadata
CREATE POLICY "Users can view own sync metadata" ON sync_metadata
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text));

CREATE POLICY "Users can manage own sync metadata" ON sync_metadata
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid()::text));

-- Comments
COMMENT ON TABLE users IS 'User accounts synced with Supabase Auth';
COMMENT ON TABLE trips IS 'Trip itineraries with full JSONB data';
COMMENT ON TABLE sync_metadata IS 'Tracks sync state for offline-first conflict resolution';
