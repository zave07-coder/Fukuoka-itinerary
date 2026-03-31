# ⚡ Quick Start: Google OAuth in 5 Minutes

**Goal:** Get Google "Sign in" button working

---

## Step 1: Google Cloud Console (3 min)

1. Go to: https://console.cloud.google.com/
2. Create project: "Wahgola"
3. Go to: **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: **Wahgola**
   - Add domain: `supabase.co`
   - Add test user (your email)
4. Go to: **APIs & Services → Credentials**
   - Create: **OAuth client ID** → **Web application**
   - Authorized origin: `https://gdhyukplodnvokrmxvba.supabase.co`
   - Redirect URI: `https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/callback`
5. **Copy the Client ID and Client Secret** ⚠️

---

## Step 2: Supabase (1 min)

1. Go to: https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba
2. **Authentication** → **Providers** → **Google**
3. Toggle ON
4. Paste Client ID and Client Secret
5. Save

---

## Step 3: Get Supabase Key (30 sec)

1. **Project Settings** → **API**
2. Copy the **`anon public`** key

---

## Step 4: Update Config (30 sec)

Edit `config.js`:

```javascript
window.SUPABASE_CONFIG = {
  SUPABASE_URL: 'https://gdhyukplodnvokrmxvba.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbG...' // Paste your key here
};
```

---

## Test It!

```bash
npx wrangler pages dev . --port 8788
```

Open: http://localhost:8788/login.html

Click **"Continue with Google"** → Should work! ✨

---

## Production Deploy

**Cloudflare Pages → Settings → Environment variables:**

Add:
- `SUPABASE_URL` = `https://gdhyukplodnvokrmxvba.supabase.co`
- `SUPABASE_ANON_KEY` = `[your-anon-key]`

Then redeploy.

---

**Done!** 🎉

For detailed instructions, see: `GOOGLE_AUTH_SETUP.md`
