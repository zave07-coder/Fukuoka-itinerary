# POI Image System - Setup Status

## ✅ Completed Steps

### 1. Code Implementation
- ✅ Backend API handler (`/api/poi-image`) in `_worker.js`
- ✅ Dual API support (Google Places New + Legacy)
- ✅ Waterfall fetching: Cache → Google → Unsplash → Placeholder
- ✅ Frontend service (`poi-image-service.js`)
- ✅ Database schema (`poi_images_schema.sql`)

### 2. Environment Configuration
- ✅ Google Places API key stored in `.env` file
- ✅ Google Places API key set in Cloudflare Pages production environment
- ✅ Project: `fukuoka-itinerary-git`

### 3. API Key Details
```
API Key: AIzaSyBRaCjDtoLx_DnzjCQ4RyImwL_KwpVY8yo
Project ID: 302910440522
Status: Valid key, but APIs not enabled yet
```

## ⚠️ Remaining Steps (YOU NEED TO DO THESE)

### Step 1: Enable Google Places API

**Choose ONE of these options:**

**Option A: Places API (New) - RECOMMENDED**
1. Click: https://console.developers.google.com/apis/api/places.googleapis.com/overview?project=302910440522
2. Click "ENABLE"
3. Wait 2-3 minutes for propagation

**Option B: Places API (Legacy)**
1. Click: https://console.developers.google.com/apis/library/places-backend.googleapis.com?project=302910440522
2. Click "ENABLE"
3. Wait 2-3 minutes

### Step 2: Enable Billing (if not already)

Google Places requires billing to be enabled (even for free tier):
1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=302910440522
2. Link a billing account
3. Set budget alerts at $50/month (optional but recommended)

**Note:** First 100,000 photo requests/month are FREE

### Step 3: Create Supabase Database Table

Run this SQL in Supabase:
👉 https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba/sql

```sql
-- Copy from poi_images_schema.sql
CREATE TABLE poi_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poi_name TEXT NOT NULL,
  location_lat NUMERIC(10, 7),
  location_lng NUMERIC(10, 7),
  image_url TEXT NOT NULL,
  source TEXT NOT NULL,
  attribution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poi_name, location_lat, location_lng)
);

CREATE INDEX idx_poi_images_name ON poi_images(poi_name);
CREATE INDEX idx_poi_images_location ON poi_images(location_lat, location_lng);
CREATE INDEX idx_poi_images_source ON poi_images(source);

CREATE TRIGGER update_poi_images_updated_at BEFORE UPDATE ON poi_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 4: Test the API

After enabling Google Places API, test with:

```bash
curl -s "https://places.googleapis.com/v1/places:searchText" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: AIzaSyBRaCjDtoLx_DnzjCQ4RyImwL_KwpVY8yo" \
  -H "X-Goog-FieldMask: places.displayName,places.photos" \
  -d '{"textQuery": "Fukuoka Tower"}'
```

Expected result: JSON with place data and photos ✅

### Step 5: Deploy

```bash
# Option A: Automatic (triggers on git push)
git add .
git commit -m "feat: Add POI image caching system"
git push

# Option B: Manual
wrangler pages deploy .
```

## 🧪 Testing After Deployment

### Test the Backend API

```bash
# Test POI image endpoint
curl -X POST https://fkk.zavecoder.com/api/poi-image \
  -H "Content-Type: application/json" \
  -d '{
    "poiName": "Fukuoka Tower",
    "location": {"lat": 33.5934, "lng": 130.3564},
    "category": "attraction"
  }'
```

Expected response:
```json
{
  "imageUrl": "https://places.googleapis.com/v1/places/.../media?...",
  "source": "google-new",
  "attribution": "Photo attribution text",
  "cached": false
}
```

### Test from Browser Console

Open https://fkk.zavecoder.com and run:

```javascript
// Test the service
const result = await window.poiImageService.getImage(
  'Fukuoka Tower',
  { lat: 33.5934, lng: 130.3564 },
  'attraction'
);

console.log('Image URL:', result.imageUrl);
console.log('Source:', result.source);
console.log('Cached:', result.cached);
```

## 📊 Cost Monitoring

### Google Cloud Console
- Dashboard: https://console.cloud.google.com/apis/dashboard?project=302910440522
- Usage: Check "Places API (New)" or "Places API"
- Billing: https://console.cloud.google.com/billing?project=302910440522

### Free Tier Limits
- First 100,000 photo requests/month: **FREE**
- Each additional 1,000 requests: **$7.00**

### Set Budget Alerts
1. Go to Billing → Budgets & Alerts
2. Create budget: $50/month
3. Set alerts at 50%, 90%, 100%

## 📁 Files Summary

| File | Status | Purpose |
|------|--------|---------|
| `_worker.js` | ✅ Updated | Backend API with dual Google API support |
| `poi-image-service.js` | ✅ Created | Frontend service for fetching images |
| `poi_images_schema.sql` | ✅ Created | Database schema for caching |
| `.env` | ✅ Created | Local environment variables |
| `enable-google-apis.sh` | ✅ Created | Setup instructions |
| `POI_IMAGES_README.md` | ✅ Created | Complete documentation |

## 🎯 Current System Architecture

```
User Request
    ↓
In-Memory Cache (Frontend) ← Instant if cached
    ↓ Miss
Backend Worker (/api/poi-image)
    ↓
Supabase Cache (Database) ← ~50ms if cached
    ↓ Miss
Google Places API (New) ← ~500ms, costs after 100k
    ↓ Failed/Not enabled
Google Places API (Legacy) ← Fallback
    ↓ Failed
Unsplash API ← FREE (if UNSPLASH_ACCESS_KEY set)
    ↓ Failed
Category Placeholder ← Always works
```

## ❓ Troubleshooting

### "Places API (New) has not been used"
→ Go to Step 1 above and enable the API

### "REQUEST_DENIED" error
→ Enable billing in Google Cloud Console

### "No place found"
→ POI name too generic or location wrong (this is OK, falls back to Unsplash)

### Images not showing in UI
→ Make sure to include `poi-image-service.js` in your HTML:
```html
<script src="poi-image-service.js?v=1"></script>
```

## 🚀 Next Steps After Setup

1. **Integrate into UI**: Add POI images to trip-planner.html
2. **Monitor costs**: Check Google Cloud Console weekly
3. **Optimize cache**: Monitor cache hit rates in Supabase
4. **Add Unsplash**: Get API key for better fallback (optional)

---

Last Updated: 2026-04-02
System Status: ⚠️ Ready to deploy (pending Google API enablement)
