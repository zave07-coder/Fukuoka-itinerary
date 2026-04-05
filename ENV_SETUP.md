# Environment Variables Setup

This project requires several environment variables to be configured in Cloudflare Pages.

## Required Variables

### Supabase (Database & Auth)
These are already set in `wrangler.toml` with fallback values:
- ✅ `SUPABASE_URL` - Your Supabase project URL
- ✅ `SUPABASE_ANON_KEY` - Public anon key (safe to expose)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - **Secret** service role key

### API Keys (Required)
- ✅ `OPENAI_API_KEY` - For AI trip generation
- ⚠️ `GOOGLE_PLACES_API_KEY` - For POI photos (optional)
- ⚠️ `GOOGLE_AI_API_KEY` - For Gemini fallback (optional)

## How to Set Environment Variables

### Option 1: Cloudflare Pages Dashboard (Recommended for Secrets)

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add variables for both **Production** and **Preview**:
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`
   - `GOOGLE_PLACES_API_KEY` = `your-google-api-key`
   - Any other secrets

### Option 2: wrangler.toml (For Non-Sensitive Values)

Already configured in `wrangler.toml`:
```toml
[vars]
SUPABASE_URL = "https://gdhyukplodnvokrmxvba.supabase.co"
SUPABASE_ANON_KEY = "your-anon-key"
```

### Option 3: Using Wrangler CLI

```bash
# Set a secret for production
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name=fukuoka-itinerary-git

# Set a secret for preview
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name=fukuoka-itinerary-git --env=preview
```

## Current Status

✅ **Working with fallback values:**
- The worker has hardcoded fallback values for Supabase credentials
- This works but is not ideal for production
- Fallbacks are in `_worker.js` SupabaseClient constructor

⚠️ **Should be set in environment:**
- `SUPABASE_SERVICE_ROLE_KEY` - Currently using fallback
- `GOOGLE_PLACES_API_KEY` - Not set (POI images will use Unsplash only)

## Verifying Environment Variables

After deployment, check the Cloudflare Functions logs to see which values are being used:
- "ℹ️ Using fallback SUPABASE_URL" - means env var is not set
- "🔧 SupabaseClient initialized with URL: ..." - shows which URL is active

## Security Note

⚠️ **NEVER commit secrets to git**
- Service role keys should only be in Cloudflare environment
- The current fallback values should be rotated and set as secrets
- Public keys (anon key) are safe in `wrangler.toml`
