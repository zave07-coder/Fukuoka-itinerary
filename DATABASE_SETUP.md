# Database Setup Instructions

The app uses Supabase as the backend database for syncing trips across devices.

## Quick Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase-schema.sql`
6. Paste it into the SQL Editor
7. Click **Run** or press `Ctrl+Enter`

## What This Creates

The schema creates 4 tables:

### 1. `users`
- Stores user profile data synced from Supabase Auth
- Links to auth.users via `supabase_user_id`
- Has RLS (Row Level Security) enabled

### 2. `trips`
- Stores trip itineraries
- Each trip belongs to a user
- Stores full trip data as JSONB
- Has RLS enabled (users can only access their own trips)

### 3. `sync_metadata`
- Tracks sync state per device
- Used for conflict resolution
- Has RLS enabled

### 4. `poi_images`
- Caches POI (Point of Interest) images from Google Places and Unsplash
- Public cache (no RLS needed)
- Prevents redundant API calls

## Verifying Setup

After running the schema:

1. Go to **Table Editor** in Supabase dashboard
2. You should see all 4 tables listed
3. Try logging into the app
4. The `users` table should have a new row with your account
5. Create a trip and sync it
6. The `trips` table should have your trip data

## Environment Variables

Make sure these are set in Cloudflare Pages:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (secret!)
- `SUPABASE_ANON_KEY` - Your anon/public key (safe to expose)

To find these values:
1. Go to Project Settings > API
2. Copy URL and keys from there

## Troubleshooting

### "User not found" error
- The user hasn't been synced to the database yet
- Try logging out and back in
- Check if the `users` table has your row

### "Supabase upsert failed" error
- Table might not exist - run the schema SQL
- Check if service role key is correct
- Verify the schema was created successfully

### Sync fails silently
- Check browser console for errors
- Check Cloudflare Pages Functions logs
- Verify environment variables are set

## Resetting the Database

If you need to start fresh:

```sql
DROP TABLE IF EXISTS sync_metadata CASCADE;
DROP TABLE IF EXISTS poi_images CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then re-run the schema from `supabase-schema.sql`.
