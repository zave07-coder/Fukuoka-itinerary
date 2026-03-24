# Setup Instructions

## 🔒 Privacy Configuration

This site is configured to be **non-crawlable** by search engines:
- ✅ `robots.txt` blocks all search engines
- ✅ Meta tags include `noindex, nofollow`

## 🗺️ Mapbox Maps Setup (REQUIRED)

The interactive map uses **Mapbox GL JS** with routing, waypoints, and POI overlays.

### Required: Add Mapbox Token

1. **Create free Mapbox account:**
   - Go to https://account.mapbox.com/auth/signup/
   - Sign up (free tier: 50,000 map loads/month)

2. **Get your access token:**
   - After signup, go to https://account.mapbox.com/access-tokens/
   - Copy your **Default public token** (starts with `pk.`)

3. **Add to Cloudflare Pages:**
   - Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
   - Select your project: `fukuoka-itinerary-git`
   - Go to **Settings** → **Environment variables**
   - Add a new variable:
     - **Variable name:** `MAPBOX_TOKEN`
     - **Value:** Your Mapbox token (pk.ey...)
     - **Environment:** Production and Preview
   - Click **Save**
   - Redeploy the site

### Map Features
- ✅ Day-by-day routing with driving directions
- ✅ 18+ waypoints with custom markers
- ✅ POI (restaurant, attraction, landmark) overlays
- ✅ 3D tilt, navigation controls, geolocation
- ✅ Route visualization between stops

## 🤖 AI Chat Assistant Setup

The AI Trip Assistant uses OpenAI GPT-4o Mini for interactive itinerary customization.

### Required: Add OpenAI API Key

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Select your project: `fukuoka-itinerary-git`
3. Go to **Settings** → **Environment variables**
4. Add a new variable:
   - **Variable name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key (get from https://platform.openai.com/api-keys)
   - **Environment:** Production (and Preview if desired)
5. Click **Save**
6. Redeploy the site

### Cost Estimate

Using GPT-4o Mini (very affordable):
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens
- Average chat session: ~$0.001-0.005

## 🗺️ Interactive Map

The site now uses **Leaflet** (OpenStreetMap) instead of Google Maps:
- ✅ No API key required
- ✅ Free to use
- ✅ Fully interactive with custom markers
- ✅ All locations pre-loaded

## ✈️ Flight Information

Updated with actual flight details:
- **Outbound:** SIN 01:20 → FUK 08:20 (June 14, 2026) - SQ 656
- **Return:** FUK 10:00 → SIN 15:00 (June 23, 2026) - SQ 655

## 🚀 Deployment

Already configured with GitHub auto-deployment:
- Push to `main` branch → Automatic production deploy
- Every PR → Automatic preview deployment

## 📝 Features

### Current Features
- ✅ 10-day detailed itinerary
- ✅ Interactive map with 18+ locations
- ✅ Filter by activity type (beach, cultural, kids, road trip)
- ✅ Restaurant recommendations
- ✅ Budget calculator
- ✅ Mobile-responsive design
- ✅ AI chat assistant (requires API key)

### AI Assistant Capabilities
Once configured, users can:
- Adjust daily schedules
- Add or remove activities
- Find alternative restaurants
- Update map with new locations
- Get travel recommendations

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run locally with Wrangler
npx wrangler pages dev .

# Deploy manually
npx wrangler pages deploy . --project-name=fukuoka-itinerary-git
```

## 📱 Access

- **Production:** https://fukuoka-itinerary-git.pages.dev
- **GitHub:** https://github.com/zave07-coder/Fukuoka-itinerary
