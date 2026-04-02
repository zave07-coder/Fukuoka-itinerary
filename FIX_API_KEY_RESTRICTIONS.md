# Fix Google Places API Key Restrictions

## 🔴 Current Issue

Your API key `AIzaSyBRaCjDtoLx_DnzjCQ4RyImwL_KwpVY8yo` has **restrictions** that block Places API requests:

```
Error: "Requests to this API places.googleapis.com method google.maps.places.v1.Places.SearchText are blocked."
Reason: API_KEY_SERVICE_BLOCKED
```

## ✅ Solution: Update API Key Restrictions

### Step 1: Go to API Key Configuration

👉 **Direct Link**: https://console.cloud.google.com/apis/credentials/key/AIzaSyBRaCjDtoLx_DnzjCQ4RyImwL_KwpVY8yo?project=302910440522

Or manually:
1. Go to: https://console.cloud.google.com/apis/credentials?project=302910440522
2. Find your API key: `AIzaSyBRaCjDtoLx_DnzjCQ4RyImwL_KwpVY8yo`
3. Click the pencil icon to edit

### Step 2: Configure API Restrictions

Scroll to **"API restrictions"** section:

**Option A: Remove all restrictions (Quick & Easy)**
- Select: **"Don't restrict key"**
- Click **"Save"**
- ⚠️ Less secure but works immediately

**Option B: Restrict to specific APIs (Recommended)**
- Select: **"Restrict key"**
- Click **"Select APIs"**
- Enable these APIs:
  - ✅ **Places API (New)**
  - ✅ **Places API** (if you see it)
  - ✅ **Maps JavaScript API** (optional, for maps)
  - ✅ **Geocoding API** (optional, for address lookup)
- Click **"Save"**

### Step 3: Configure Application Restrictions (Optional)

For better security, restrict where the key can be used:

**For Cloudflare Pages:**
- Select: **"HTTP referrers (web sites)"**
- Add these referrers:
  ```
  https://fkk.zavecoder.com/*
  https://wahgola.zavecoder.com/*
  https://*.fukuoka-itinerary-git.pages.dev/*
  ```
- Click **"Save"**

**Or use IP addresses:**
- Select: **"IP addresses (web servers, cron jobs, etc.)"**
- Add Cloudflare Pages IP ranges (complex, not recommended)

**For development/testing:**
- Keep it as **"None"** for now

### Step 4: Wait & Test

After saving:
1. **Wait 2-3 minutes** for changes to propagate
2. Run this test command:

```bash
curl -s "https://places.googleapis.com/v1/places:searchText" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: AIzaSyBRaCjDtoLx_DnzjCQ4RyImwL_KwpVY8yo" \
  -H "X-Goog-FieldMask: places.displayName,places.photos" \
  -d '{"textQuery": "Fukuoka Tower"}'
```

**Expected Success Response:**
```json
{
  "places": [
    {
      "displayName": {
        "text": "Fukuoka Tower"
      },
      "photos": [...]
    }
  ]
}
```

## 🎯 Quick Summary

**Problem**: API key has restrictions blocking Places API
**Solution**: Remove restrictions OR add Places API to allowed list
**Link**: https://console.cloud.google.com/apis/credentials/key/AIzaSyBRaCjDtoLx_DnzjCQ4RyImwL_KwpVY8yo?project=302910440522

## 🔒 Security Best Practices

After everything is working:

1. **Enable Application Restrictions**
   - Restrict to your domain (fkk.zavecoder.com)
   - Prevents unauthorized use

2. **Set Quota Limits**
   - Go to: https://console.cloud.google.com/apis/api/places.googleapis.com/quotas?project=302910440522
   - Set daily quota limit (e.g., 10,000 requests/day)

3. **Enable Billing Alerts**
   - Set budget at $50/month
   - Get alerts at 50%, 90%, 100%

## ❓ Still Not Working?

Try creating a **new API key**:

1. Go to: https://console.cloud.google.com/apis/credentials?project=302910440522
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"API key"**
4. Copy the new key
5. Add it to Cloudflare Pages environment variables

Then update `.env` and Cloudflare with the new key.

---

**Next Step**: Go to the link above and update your API key restrictions!
