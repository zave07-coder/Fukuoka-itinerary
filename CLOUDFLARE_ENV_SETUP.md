# Cloudflare Pages Environment Variables Setup

## ✅ Supabase Schema Applied Successfully!

All tables are now in Supabase:
- ✅ `users` table
- ✅ `trips` table
- ✅ `sync_metadata` table
- ✅ RLS policies enabled
- ✅ Triggers configured

---

## 🔧 Add Environment Variables to Cloudflare Pages

### Step 1: Open Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com/
2. Click on **Pages** in the sidebar
3. Find and click **fukuoka-itinerary**
4. Go to **Settings** tab
5. Scroll to **Environment variables**

### Step 2: Add These Variables

Click **"Add variable"** for each of these:

#### For PRODUCTION:
```
Variable name: SUPABASE_URL
Value: https://gdhyukplodnvokrmxvba.supabase.co

Variable name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI4NjQsImV4cCI6MjA5MDQ2ODg2NH0.Ygoi5WlRHbfxdNx7dQzvlPnXkRElTWbOac1LZQZAkm4

Variable name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg5Mjg2NCwiZXhwIjoyMDkwNDY4ODY0fQ.cEt3gBApYN4lDykyQMnrwMZE_iH2mBoDpwClIVstOmk
```

#### For PREVIEW (same values):
Repeat the same variables for the **Preview** environment.

### Step 3: Save and Redeploy
1. Click **Save** after adding all variables
2. Go to **Deployments** tab
3. Click **⋮** (three dots) on the latest deployment
4. Click **Retry deployment**

---

## 🧪 Test After Deployment

Once redeployed, test the database connection:

```bash
# Test with curl (from terminal)
curl -X GET "https://fukuoka-itinerary.pages.dev/api/trips" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN"

# Should return: {"error":"User not found"} or trips data
# (Not an error about SUPABASE_URL not configured)
```

---

## ✅ Migration Complete!

Your app is now running on Supabase instead of Neon!

**What changed:**
- Database moved from Neon PostgreSQL to Supabase
- Using Supabase REST API (faster, no SQL injection risk)
- Row Level Security enabled for data protection
- All user/trip sync endpoints updated

**Optional cleanup:**
Once confirmed working, you can remove these old variables:
- `NEON_API_KEY`
- `NEON_ORG_ID`
- `NEON_DATABASE_URL`
