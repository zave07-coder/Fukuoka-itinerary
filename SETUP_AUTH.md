# 🔐 Authentication & Cloud Sync Setup Guide

This guide will help you set up Supabase authentication and Neon database cloud sync for Wahgola.

## 📋 Prerequisites

- Supabase account (free tier works)
- Neon database already configured (you have this ✅)
- Cloudflare Pages deployment

## 🚀 Step 1: Create Supabase Project

1. **Go to** https://supabase.com/dashboard
2. **Click** "New Project"
3. **Configure:**
   - **Project Name:** `wahgola` (or any name you like)
   - **Database Password:** Generate a strong password (save it)
   - **Region:** `Southeast Asia (Singapore)` (ap-southeast-1, same as your Neon DB)
4. **Wait** for project creation (~2 minutes)

## 🔑 Step 2: Get Supabase Credentials

1. **Go to** Project Settings → API
2. **Copy these values:**
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon (public) key** (starts with `eyJ...`)

## 🎯 Step 3: Configure Google OAuth

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Providers**
   - Find **Google** and click to expand

2. **Create Google OAuth Credentials:**
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs:**
     ```
     https://xxxxx.supabase.co/auth/v1/callback
     ```
     (Replace `xxxxx` with your Supabase project ID)
   - **Copy** Client ID and Client Secret

3. **Back in Supabase:**
   - Paste **Client ID** and **Client Secret**
   - Click **Save**

## 💾 Step 4: Create Database Schema

1. **Run the schema SQL in your Neon database:**

   ```bash
   # You can use the Neon SQL Editor or connect via psql
   psql "postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.neon.tech/neondb?sslmode=require" < schema.sql
   ```

   Or copy-paste the contents of `schema.sql` into Neon's SQL Editor:
   - Go to https://console.neon.tech/
   - Select your project: `morning-sound-56401133`
   - Go to **SQL Editor**
   - Paste the schema from `schema.sql`
   - Click **Run**

## ⚙️ Step 5: Add Environment Variables to Cloudflare

### Option A: Via Cloudflare Dashboard (Recommended)

1. **Go to** https://dash.cloudflare.com/
2. **Navigate to** Pages → Your Project → Settings → Environment Variables
3. **Add these variables:**

   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...your-key-here
   ```

4. **Click** "Save"
5. **Redeploy** your site (Settings → Deployments → Redeploy)

### Option B: Via Cloudflare API (If you have API token)

```bash
# Set your Cloudflare account ID and API token
export CF_ACCOUNT_ID="your-account-id"
export CF_API_TOKEN="your-api-token"
export CF_PROJECT_NAME="your-pages-project-name"

# Add Supabase URL
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$CF_PROJECT_NAME/env_vars" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SUPABASE_URL",
    "value": "https://xxxxx.supabase.co",
    "type": "secret_text"
  }'

# Add Supabase Anon Key
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$CF_PROJECT_NAME/env_vars" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SUPABASE_ANON_KEY",
    "value": "eyJhbGc...your-key-here",
    "type": "secret_text"
  }'
```

## ✅ Step 6: Test Authentication

1. **Visit** your deployed site
2. **Click** "Sign In" button (top right)
3. **Try** signing in with Google
4. **Check** that you see your avatar in the top-right corner
5. **Create** a new trip and verify sync status shows "Synced"

## 🔧 Troubleshooting

### "Authentication not available in offline mode"
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Cloudflare
- Redeploy your site after adding environment variables
- Clear browser cache

### "Failed to sync user to database"
- Verify the database schema was created in Neon
- Check that `NEON_DATABASE_URL` and `NEON_API_KEY` are correct
- Look at Cloudflare Pages function logs for errors

### Google OAuth not working
- Verify the redirect URI in Google Console matches exactly:
  `https://xxxxx.supabase.co/auth/v1/callback`
- Make sure Google OAuth is enabled in Supabase Dashboard
- Check that Client ID and Secret are correctly pasted

### Sync not working
- Open browser DevTools → Console
- Look for any error messages
- Verify you're signed in (avatar should be visible)
- Try clicking the sync indicator to manually trigger sync

## 📊 How It Works

### Architecture
- **Supabase:** Handles authentication only (Google OAuth + Magic Links)
- **Neon PostgreSQL:** Stores all trip data and user information
- **localStorage:** Primary data store (offline-first)
- **Cloudflare Worker:** Backend API to sync between localStorage and Neon

### Sync Flow
1. User creates/edits trip → Saved to localStorage immediately
2. If authenticated → Auto-sync to Neon every 5 minutes
3. On login → Migrate all localStorage trips to cloud
4. On page load → Pull latest trips from cloud (if authenticated)

### Conflict Resolution
- Cloud trips with newer `updated_at` timestamps override local
- Each device has unique ID for tracking sync state
- Sync metadata table prevents data loss

## 🎉 Next Steps

Once authentication is working:

1. **Test multi-device sync:**
   - Sign in on desktop
   - Create a trip
   - Sign in on mobile with same account
   - Verify trip appears

2. **Enable email magic links:**
   - Already configured! Users can use "Continue with Email"
   - No password needed - they get a magic link via email

3. **Optional enhancements:**
   - Real-time sync with Supabase Realtime
   - Conflict resolution UI when multiple devices edit same trip
   - Sharing trips with other users

## 📝 Notes

- **Offline-first:** App works without authentication
- **Privacy:** Trip data stays in localStorage unless user signs in
- **Free tier limits:**
  - Supabase: 50,000 monthly active users
  - Neon: 3 GB storage, 100 hours compute
- **Security:** JWT tokens expire after 1 hour, auto-refresh handled by Supabase client

## 🔐 Environment Variables Summary

Your complete `.env` should now have:

```bash
# AI APIs
OPENAI_API_KEY=sk-proj-...
GOOGLE_AI_API_KEY=AIza...

# Database
NEON_API_KEY=napi_...
NEON_ORG_ID=org-billowing-shadow-01919437
NEON_DATABASE_URL=postgresql://...

# Maps
MAPBOX_TOKEN=pk.eyJ...

# Authentication (NEW)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

Remember to add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to **Cloudflare Pages environment variables** as well!
