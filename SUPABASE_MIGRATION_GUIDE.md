# Supabase Migration Guide

## ✅ Completed Steps

1. **Database Schema Created** - `supabase_migration.sql`
2. **Worker Updated** - `_worker.js` now uses Supabase REST API
3. **Code Deployed** - Commit `d20f730` pushed to GitHub

---

## 🔧 Manual Steps Required

### Step 1: Apply Database Schema to Supabase

1. Go to your Supabase SQL Editor:
   https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba/sql/new

2. Copy the contents of `supabase_migration.sql`

3. Paste into the SQL Editor and click **"Run"**

This will create:
- `users` table
- `trips` table
- `sync_metadata` table
- Indexes for performance
- Triggers for auto-updating timestamps
- Row Level Security (RLS) policies

### Step 2: Update Cloudflare Pages Environment Variables

The environment variables are already in `.env`, but you need to add them to Cloudflare Pages:

1. Go to: https://dash.cloudflare.com/
2. Navigate to: **Pages** → **fukuoka-itinerary** → **Settings** → **Environment variables**
3. Add these variables (both **Production** and **Preview**):

```
SUPABASE_URL=https://gdhyukplodnvokrmxvba.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI4NjQsImV4cCI6MjA5MDQ2ODg2NH0.Ygoi5WlRHbfxdNx7dQzvlPnXkRElTWbOac1LZQZAkm4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg5Mjg2NCwiZXhwIjoyMDkwNDY4ODY0fQ.cEt3gBApYN4lDykyQMnrwMZE_iH2mBoDpwClIVstOmk
```

4. Click **Save**
5. Trigger a new deployment (already done with latest commit)

---

## 📊 Migration Summary

### What Changed

**Before (Neon):**
- Used Neon's HTTP SQL API with PostgreSQL connection string
- Required `executeSQL()` helper function
- Direct SQL queries with parameters

**After (Supabase):**
- Uses Supabase REST API (PostgREST)
- `SupabaseClient` class with methods: `query()`, `insert()`, `update()`, `delete()`, `upsert()`
- Row Level Security (RLS) for built-in auth protection
- No SQL injection risk (uses REST API)

### API Endpoints That Use Database

- ✅ `/api/sync-user` - Creates/updates user in Supabase
- ✅ `/api/trips` - GET (pull trips) / POST (push trip)
- ⏳ `/api/save-change` - Stubbed (not using DB yet)
- ⏳ `/api/get-changes` - Stubbed (returns empty array)
- ⏳ `/api/create-snapshot` - Stubbed (returns mock ID)
- ⏳ `/api/undo` - Stubbed
- ⏳ `/api/redo` - Stubbed
- ⏳ `/api/get-history` - Stubbed

### Optional: Remove Neon Variables

Once you verify Supabase works, you can remove these from `.env` and Cloudflare:
- `NEON_API_KEY`
- `NEON_ORG_ID`
- `NEON_DATABASE_URL`

---

## 🧪 Testing

After applying the schema and environment variables:

1. **Test trip sync:**
   ```bash
   # Create a trip and save - should sync to Supabase
   # Check Supabase dashboard → Table Editor → trips
   ```

2. **Verify Supabase dashboard:**
   - https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba/editor
   - Check that tables exist
   - Try inserting a test row

3. **Check Cloudflare logs:**
   - https://dash.cloudflare.com/
   - Pages → fukuoka-itinerary → Deployments → Latest → View details
   - Look for any errors related to Supabase

---

## 🔐 Security Notes

- **Service Role Key** is only used server-side (Cloudflare Worker)
- **Anon Key** is safe to expose in frontend
- **RLS Policies** ensure users can only access their own data
- All database access goes through Supabase's authenticated API

---

## 🐛 Troubleshooting

**If you see errors like "table does not exist":**
- You forgot to run the SQL migration in Supabase dashboard

**If you see "SUPABASE_URL not configured":**
- You forgot to add environment variables to Cloudflare Pages

**If trips aren't saving:**
- Check Cloudflare Worker logs for errors
- Verify RLS policies are enabled in Supabase
- Make sure user is authenticated before calling `/api/trips`

---

## Next Steps

1. Apply `supabase_migration.sql` in Supabase SQL Editor ⬅️ **DO THIS NOW**
2. Add environment variables to Cloudflare Pages (see Step 2 above)
3. Wait for deployment to finish (~1-2 minutes)
4. Test trip creation/sync
5. (Optional) Remove old Neon environment variables
