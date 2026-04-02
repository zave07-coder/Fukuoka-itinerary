# POI Image Caching System

Complete implementation of a **smart POI (Point of Interest) image fetching system** with multi-tier caching and fallback sources.

## 📋 Overview

This system automatically fetches and caches high-quality images for POIs (restaurants, temples, attractions, etc.) in your trip itineraries.

### ✨ Features

- **Multi-source fallback**: Google Places → Unsplash → Category placeholders
- **Two-tier caching**: In-memory (session) + Supabase (persistent)
- **Cost optimization**: Minimizes API calls through aggressive caching
- **Automatic attribution**: Tracks image sources for legal compliance
- **Category-aware placeholders**: Fallback images match POI type

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │
│  (Request)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  In-Memory Cache    │ ◄── Fastest (instant)
└──────┬──────────────┘
       │ Cache Miss
       ▼
┌─────────────────────┐
│   Backend Worker    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Supabase Cache     │ ◄── Fast (database lookup)
│   (poi_images)      │
└──────┬──────────────┘
       │ Cache Miss
       ▼
┌─────────────────────┐
│  Google Places API  │ ◄── Best quality ($0.007/photo after 100k)
└──────┬──────────────┘
       │ Failed/No photo
       ▼
┌─────────────────────┐
│   Unsplash API      │ ◄── Good quality (FREE, 50 req/hour)
└──────┬──────────────┘
       │ Failed
       ▼
┌─────────────────────┐
│ Category Placeholder│ ◄── Always works (static URLs)
└─────────────────────┘
```

## 💰 Cost Analysis

### Google Places Photos API Pricing

| Tier | Price | Usage Example |
|------|-------|---------------|
| 0 - 100,000 photos/month | **FREE** | ~3,300 photos/day |
| 100,001+ photos/month | **$7 per 1,000** | $0.007 per photo |

### Real-World Cost Estimation

**Scenario 1: Small app (1,000 users/month)**
- 1,000 users × 2 trips × 20 POIs = 40,000 photos
- With 80% cache hit rate = **8,000 API calls**
- **Cost: $0 (within free tier)** ✅

**Scenario 2: Medium app (10,000 users/month)**
- 10,000 users × 2 trips × 20 POIs = 400,000 photos
- With 80% cache hit rate = 80,000 API calls
- **Cost: $0 (within free tier)** ✅

**Scenario 3: Large app (50,000 users/month)**
- 50,000 users × 2 trips × 20 POIs = 2,000,000 photos
- With 80% cache hit rate = 400,000 API calls
- 300,000 paid calls = **$2,100/month**

### Unsplash API Pricing
- **FREE**: 50 requests/hour (1,200/day)
- **Paid**: Enterprise pricing for higher limits
- Requires photo attribution

## 🚀 Setup Instructions

### 1. Create Database Table

Run this SQL in [Supabase SQL Editor](https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba/sql):

```sql
-- See poi_images_schema.sql for complete schema
CREATE TABLE poi_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poi_name TEXT NOT NULL,
  location_lat NUMERIC(10, 7),
  location_lng NUMERIC(10, 7),
  image_url TEXT NOT NULL,
  source TEXT NOT NULL,
  attribution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poi_name, location_lat, location_lng)
);
```

### 2. Get API Keys

#### Google Places API (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable these APIs:
   - **Places API** (New)
   - **Places API (Legacy)** (for photo references)
4. Create API key → Restrict to:
   - Places API
   - Cloudflare Pages IP ranges (or use Application Restriction)
5. Set quota limits to control costs

#### Unsplash API (Optional)
1. Create account at [Unsplash Developers](https://unsplash.com/developers)
2. Create new app (free tier)
3. Get **Access Key** (not Secret Key)
4. Note: Requires attribution in UI

### 3. Set Environment Variables

**Option A: Automated (Recommended)**
```bash
./setup-poi-images.sh
```

**Option B: Manual via Cloudflare Dashboard**
1. Go to [Cloudflare Pages](https://dash.cloudflare.com/)
2. Select project `fkk-zavecoder-com`
3. Settings → Environment Variables
4. Add:
   - `GOOGLE_PLACES_API_KEY` = `your_google_key`
   - `UNSPLASH_ACCESS_KEY` = `your_unsplash_key` (optional)

**Option C: Manual via API**
```bash
export CLOUDFLARE_API_TOKEN="your_token"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"

curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/fkk-zavecoder-com" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "deployment_configs": {
      "production": {
        "env_vars": {
          "GOOGLE_PLACES_API_KEY": {"value": "YOUR_KEY_HERE"},
          "UNSPLASH_ACCESS_KEY": {"value": "YOUR_KEY_HERE"}
        }
      }
    }
  }'
```

### 4. Deploy

```bash
# Deploy to Cloudflare Pages
wrangler pages deploy .

# Or via git push (if configured)
git add .
git commit -m "feat: Add POI image caching system"
git push
```

## 📖 Usage

### Frontend JavaScript

```javascript
// Include the service
<script src="poi-image-service.js?v=1"></script>

// Get single POI image
const imageData = await window.poiImageService.getImage(
  'Fukuoka Tower',              // POI name
  { lat: 33.5934, lng: 130.3564 }, // Location (optional)
  'attraction'                   // Category (optional)
);

console.log(imageData.imageUrl);    // URL to display
console.log(imageData.source);      // 'google', 'unsplash', or 'placeholder'
console.log(imageData.attribution); // Attribution text (if required)

// Batch fetch multiple POIs
const images = await window.poiImageService.getBatch([
  { poiName: 'Fukuoka Tower', location: {...}, category: 'attraction' },
  { poiName: 'Ichiran Ramen', location: {...}, category: 'restaurant' },
  { poiName: 'Ohori Park', location: {...}, category: 'park' }
]);
```

### Display with Attribution

```html
<div class="poi-card">
  <img src="${imageData.imageUrl}" alt="${poiName}">
  ${imageData.attribution ? `
    <div class="attribution">
      ${imageData.attribution}
    </div>
  ` : ''}
</div>
```

### React/Vue Example

```jsx
// React component
function POICard({ poi }) {
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    window.poiImageService.getImage(
      poi.name,
      poi.location,
      poi.category
    ).then(setImageData);
  }, [poi]);

  if (!imageData) return <div>Loading...</div>;

  return (
    <div className="poi-card">
      <img src={imageData.imageUrl} alt={poi.name} />
      {imageData.attribution && (
        <small>{imageData.attribution}</small>
      )}
    </div>
  );
}
```

## 🎯 How Caching Works

### Cache Levels

1. **In-Memory Cache** (Frontend)
   - Duration: Current session only
   - Speed: Instant
   - Benefit: Zero network requests for repeated views

2. **Supabase Cache** (Database)
   - Duration: Permanent (until manually cleared)
   - Speed: ~50-100ms
   - Benefit: Shared across all users

3. **API Fetch** (External)
   - Google Places: ~300-500ms
   - Unsplash: ~200-400ms
   - Placeholder: Instant (static URL)

### Cache Hit Scenarios

**First user requests "Fukuoka Tower"**
```
Request → Memory Miss → DB Miss → Google API → Cache & Return
Time: ~500ms, Cost: $0.007
```

**Same user requests "Fukuoka Tower" again**
```
Request → Memory Hit → Return
Time: <1ms, Cost: $0
```

**Different user requests "Fukuoka Tower"**
```
Request → Memory Miss → DB Hit → Return
Time: ~50ms, Cost: $0
```

### Expected Cache Hit Rates

- **Week 1**: ~20% (building cache)
- **Month 1**: ~60% (popular POIs cached)
- **Month 3+**: ~80-90% (mature cache)

## 🔧 Monitoring & Maintenance

### Check Cache Performance

```sql
-- See cache statistics
SELECT
  source,
  COUNT(*) as total_images,
  COUNT(DISTINCT poi_name) as unique_pois
FROM poi_images
GROUP BY source
ORDER BY total_images DESC;
```

### Clear Stale Cache

```sql
-- Remove images older than 6 months
DELETE FROM poi_images
WHERE created_at < NOW() - INTERVAL '6 months';
```

### Monitor API Costs

**Google Cloud Console**
1. Go to [APIs & Services → Dashboard](https://console.cloud.google.com/apis/dashboard)
2. Select "Places API"
3. View usage metrics and costs

**Set Budget Alerts**
1. Go to Billing → Budgets & Alerts
2. Create budget: $50/month
3. Set alert at 50%, 90%, 100%

## 🐛 Troubleshooting

### Images not loading

**Check browser console:**
```javascript
// Test API endpoint
fetch('/api/poi-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    poiName: 'Test Location',
    category: 'restaurant'
  })
}).then(r => r.json()).then(console.log);
```

**Common issues:**
- ❌ `GOOGLE_PLACES_API_KEY not configured` → Add env var
- ❌ `No place found` → POI name too generic or wrong location
- ❌ `No photos available` → Fallback to Unsplash/placeholder (working as intended)

### Google API quota exceeded

```
Error: Google Places API error (429): Rate limit exceeded
```

**Solutions:**
1. Check [Google Cloud Console](https://console.cloud.google.com/apis/dashboard) for quota limits
2. Increase quota or enable billing
3. Rely more on cache + Unsplash fallback

## 📊 Performance Best Practices

1. **Lazy load images**: Only fetch when POI is visible
2. **Batch requests**: Use `getBatch()` for multiple POIs
3. **Preload popular POIs**: Cache common destinations proactively
4. **Set image dimensions**: Prevent layout shift
5. **Use WebP format**: Smaller file sizes (future enhancement)

## 🔮 Future Enhancements

- [ ] WebP image format support
- [ ] Image resizing/optimization
- [ ] Cloudflare Images integration
- [ ] Flickr Creative Commons integration
- [ ] Wikipedia/Wikimedia Commons integration
- [ ] ML-based image quality scoring
- [ ] User-uploaded images
- [ ] Automatic image refresh (6 months)

## 📄 License & Attribution

### Unsplash Images
If using Unsplash, you MUST display attribution:
```html
Photo by [Author Name] on Unsplash
```

### Google Places Photos
Google's attribution is automatically included in the photo URL response.

## 🆘 Support

- **Issues**: Report bugs in GitHub Issues
- **Questions**: Check this README first
- **API Docs**:
  - [Google Places Photos](https://developers.google.com/maps/documentation/places/web-service/photos)
  - [Unsplash API](https://unsplash.com/documentation)
