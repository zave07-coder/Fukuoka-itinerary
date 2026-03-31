# Cloud Save & AI Generation Guide

## ✅ What's New

### 1. AI Trip Generation
- **Fixed**: AI API keys now properly configured in Cloudflare Pages
- **Models**:
  - Primary: Google Gemini 2.0 Flash (cheaper, fast)
  - Fallback: GPT-4o-mini (better quality)

### 2. Cloud Save to Supabase
- Save individual trips to cloud
- Automatic bi-directional sync
- Conflict resolution based on timestamps
- Device tracking for multi-device support

---

## How to Use

### AI Trip Generation

1. Go to **Dashboard** (https://fkk.zavecoder.com or dashboard-v2.html)
2. Click **"New Trip"** button
3. Select **"Generate with AI"**
4. Describe your trip, e.g.:
   ```
   5-day cultural trip to Kyoto visiting temples and gardens
   ```
5. Click **"Generate Trip"**
6. AI will create a detailed itinerary with:
   - Daily activities with times
   - Location details with GPS coordinates
   - Cover image from Unsplash

### Cloud Save (Manual)

Currently, cloud save functions are available via JavaScript console:

```javascript
// Save a specific trip to cloud
const tripId = 'your-trip-id-here';
await saveTripToCloud(tripId);

// Sync all trips (upload new local, download new cloud)
await syncAllTrips();
```

**Note**: You must be signed in to use cloud save features.

### Auto-Sync (Planned)

Future features:
- Automatic sync on trip save
- Sync button in dashboard UI
- Real-time sync status indicator
- Conflict resolution UI

---

## How It Works

### Cloud Save Flow

1. **Local Trip Created**
   - Trip saved to localStorage
   - Assigned unique ID and timestamps

2. **Save to Cloud**
   - Authenticated request to `/api/trips`
   - Trip data sent to Supabase
   - Stored in `trips` table with user association

3. **Load from Cloud**
   - Fetch all trips for authenticated user
   - Compare timestamps with local trips
   - Download newer cloud trips

4. **Sync (Bi-directional)**
   - Compare local vs cloud timestamps
   - Upload local trips newer than cloud
   - Download cloud trips newer than local
   - Track sync metadata per device

### API Endpoints

#### Save Trip
```http
POST /api/trips
Authorization: Bearer <supabase-token>
Content-Type: application/json

{
  "tripId": "unique-id",
  "name": "Trip Name",
  "destination": "City, Country",
  "startDate": "2026-06-14",
  "endDate": "2026-06-23",
  "coverImage": "https://...",
  "data": { /* full trip object */ },
  "deviceId": "device-uuid"
}
```

#### Load Trips
```http
GET /api/trips
Authorization: Bearer <supabase-token>
```

Returns:
```json
[
  {
    "id": "trip-uuid",
    "user_id": "user-uuid",
    "name": "Trip Name",
    "destination": "City, Country",
    "data": { /* full trip object */ },
    "created_at": "2026-03-31T...",
    "updated_at": "2026-03-31T..."
  }
]
```

---

## Database Schema

### Supabase Tables

#### `users`
- `id` - UUID (primary key)
- `supabase_user_id` - Text (auth.users reference)
- `email` - Text
- `display_name` - Text
- `avatar_url` - Text
- `created_at` - Timestamp
- `updated_at` - Timestamp

#### `trips`
- `id` - UUID (primary key)
- `user_id` - UUID (foreign key to users)
- `name` - Text
- `destination` - Text
- `start_date` - Date
- `end_date` - Date
- `cover_image` - Text
- `data` - JSONB (full trip structure)
- `created_at` - Timestamp
- `updated_at` - Timestamp
- `synced_at` - Timestamp

#### `sync_metadata`
- `id` - UUID (primary key)
- `user_id` - UUID (foreign key to users)
- `trip_id` - UUID (foreign key to trips)
- `device_id` - Text
- `last_sync` - Timestamp
- `sync_version` - Integer

### Row Level Security (RLS)

- Users can only access their own data
- Enforced at database level
- No risk of data leakage between users

---

## Testing

### Test AI Generation

1. Open Dashboard
2. Create new trip with AI
3. Test prompt: `3-day food tour of Tokyo with ramen and sushi`
4. Verify:
   - Trip generates successfully
   - Has daily activities
   - Includes locations with GPS coordinates
   - Has cover image

### Test Cloud Save (Requires Auth)

```javascript
// 1. Check if signed in
const authToken = authService.getToken();
console.log('Authenticated:', !!authToken);

// 2. Get a trip ID
const trips = tripManager.getAllTrips();
const firstTrip = trips[0];
console.log('Trip to save:', firstTrip.name, firstTrip.id);

// 3. Save to cloud
await saveTripToCloud(firstTrip.id);
// Should show: "Trip saved to cloud successfully!"

// 4. Verify in Supabase dashboard
// https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba/editor

// 5. Test sync
await syncAllTrips();
// Should show: "Sync complete! Uploaded: X, Downloaded: Y"
```

---

## Troubleshooting

### AI Generation Fails

**Error**: "AI generation failed"

**Possible causes**:
1. API keys not set in Cloudflare Pages
2. Rate limit reached on AI services
3. Network timeout

**Solution**:
- Check Cloudflare Pages environment variables
- Wait a few minutes and try again
- Check browser console for detailed error

### Cloud Save Fails

**Error**: "Please sign in to save trips to cloud"

**Solution**: Sign in using Supabase Auth first

**Error**: "User not found"

**Cause**: User doesn't exist in `users` table

**Solution**:
1. Sign in to create user entry
2. Or manually create user via Supabase dashboard

**Error**: "Failed to save trip to cloud"

**Possible causes**:
1. Network error
2. Supabase URL/keys incorrect
3. RLS policy blocking request

**Debug**:
```javascript
// Check environment
console.log('SUPABASE_URL:', SUPABASE_CONFIG?.SUPABASE_URL);
console.log('Has anon key:', !!SUPABASE_CONFIG?.SUPABASE_ANON_KEY);
```

---

## Next Steps

### Upcoming Features

1. **UI Improvements**
   - Add "Save to Cloud" button in trip cards
   - Add sync status indicator in header
   - Add sync history view

2. **Auto-Sync**
   - Automatic sync on trip edit
   - Background sync every 5 minutes
   - Offline queue for pending saves

3. **Conflict Resolution**
   - Visual diff when conflicts detected
   - User choice: keep local, keep cloud, or merge
   - Automatic merge for non-conflicting changes

4. **Sharing**
   - Generate shareable trip links
   - Public/private toggle
   - Collaborative editing

---

## Environment Variables

Make sure these are set in Cloudflare Pages:

### Production & Preview
```
SUPABASE_URL=https://gdhyukplodnvokrmxvba.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
OPENAI_API_KEY=sk-proj-...
GOOGLE_AI_API_KEY=AIzaSy...
MAPBOX_TOKEN=pk.eyJ1...
```

All set! ✅
