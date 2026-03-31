# 🔐 Google OAuth Setup Guide for Wahgola

Complete step-by-step guide to set up Google authentication with Supabase.

---

## Part 1: Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**
2. Click **"Select a Project"** dropdown (top left)
3. Click **"NEW PROJECT"**
   - **Project name:** `Wahgola`
   - **Organization:** (leave as default)
4. Click **"CREATE"**
5. Wait ~30 seconds, then select your new project

---

### Step 2: Configure OAuth Consent Screen

1. In left sidebar: **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type
3. Click **"CREATE"**

#### OAuth Consent Screen - Page 1: App Information

| Field | Value |
|-------|-------|
| **App name** | `Wahgola` |
| **User support email** | Your email address |
| **App logo** | (Optional - skip for now) |
| **Application home page** | Your Cloudflare Pages URL:<br>`https://[your-site].pages.dev` |
| **Application privacy policy link** | `https://[your-site].pages.dev/privacy` |
| **Application terms of service link** | `https://[your-site].pages.dev/terms` |

**Authorized domains:**
- Click **"+ ADD DOMAIN"**
- Add: `pages.dev`
- Click **"+ ADD DOMAIN"** again
- Add: `supabase.co`

**Developer contact information:**
- Enter your email address

4. Click **"SAVE AND CONTINUE"**

#### OAuth Consent Screen - Page 2: Scopes

5. Click **"ADD OR REMOVE SCOPES"**
6. In the filter box, search for and check these scopes:
   - ✅ `.../auth/userinfo.email` - View your email address
   - ✅ `.../auth/userinfo.profile` - View your basic profile info
   - ✅ `openid` - Authenticate using OpenID Connect
7. Click **"UPDATE"**
8. Click **"SAVE AND CONTINUE"**

#### OAuth Consent Screen - Page 3: Test Users

9. Click **"+ ADD USERS"**
10. Add your email address (and any other testers)
11. Click **"ADD"**
12. Click **"SAVE AND CONTINUE"**

#### OAuth Consent Screen - Page 4: Summary

13. Review everything
14. Click **"BACK TO DASHBOARD"**

---

### Step 3: Create OAuth 2.0 Credentials

1. In left sidebar: **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type:** Select **"Web application"**
4. **Name:** `Wahgola Web Client`

#### Authorized JavaScript origins

5. Click **"+ ADD URI"**
6. Enter:
   ```
   https://gdhyukplodnvokrmxvba.supabase.co
   ```

#### Authorized redirect URIs

7. Click **"+ ADD URI"**
8. Enter:
   ```
   https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/callback
   ```

9. Click **"CREATE"**

#### Save Your Credentials ⚠️ IMPORTANT

A popup will appear with:
- **Your Client ID** (looks like: `123456789-abc...xyz.apps.googleusercontent.com`)
- **Your Client Secret** (looks like: `GOCSPX-...`)

10. **COPY BOTH VALUES** - you'll need them in the next step!
11. Click **"OK"**

> **Tip:** You can always view these later in the Credentials page.

---

## Part 2: Supabase Configuration

### Step 1: Enable Google Provider

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Select your project: **`gdhyukplodnvokrmxvba`**
3. Left sidebar: **"Authentication"** → **"Providers"**
4. Scroll to find **"Google"**
5. Click to expand Google settings
6. Toggle **"Enable Sign in with Google"** to **ON**

### Step 2: Add Google Credentials

7. **Client ID (for OAuth):**
   - Paste your Google Client ID from Step 3
8. **Client Secret (for OAuth):**
   - Paste your Google Client Secret from Step 3
9. **Authorized Client IDs:**
   - Leave empty (only needed for Android/iOS)
10. Click **"Save"**

### Step 3: Configure Redirect URLs

1. Still in **"Authentication"**, go to **"URL Configuration"**
2. **Site URL:**
   ```
   https://[your-site].pages.dev
   ```
   (Replace with your actual Cloudflare Pages URL)

3. **Redirect URLs:** Add all these (one per line):
   ```
   https://[your-site].pages.dev/dashboard-v2.html
   https://[your-site].pages.dev/auth/callback
   http://localhost:8788/dashboard-v2.html
   http://127.0.0.1:8788/dashboard-v2.html
   ```

4. Click **"Save"**

---

## Part 3: Update Wahgola Configuration

### Step 1: Add Supabase Config (Local Development)

Edit `config.js` and update it:

```javascript
// config.js
window.MAPBOX_CONFIG = {
  token: 'YOUR_EXISTING_MAPBOX_TOKEN'
};

window.SUPABASE_CONFIG = {
  SUPABASE_URL: 'https://gdhyukplodnvokrmxvba.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
};
```

**To get your Supabase Anon Key:**
1. In Supabase Dashboard: **"Project Settings"** → **"API"**
2. Copy the **`anon` `public`** key
3. Paste it into `config.js`

### Step 2: Update Cloudflare Worker (Production)

The `_worker.js` already has Supabase config setup. Just make sure your Cloudflare environment variables are set:

```bash
# In Cloudflare Pages dashboard:
SUPABASE_URL = https://gdhyukplodnvokrmxvba.supabase.co
SUPABASE_ANON_KEY = [your-anon-key]
```

---

## Part 4: Test Your Setup

### Local Testing

1. Start local dev server:
   ```bash
   npx wrangler pages dev . --port 8788
   ```

2. Open: `http://localhost:8788/login.html`
3. Click **"Continue with Google"**
4. You should see Google OAuth popup
5. Sign in with your test user email
6. You should be redirected to `dashboard-v2.html` as logged in

### Production Testing

1. Deploy to Cloudflare Pages
2. Visit: `https://[your-site].pages.dev/login.html`
3. Test Google sign-in
4. Check browser console for any errors

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Fix:** Make sure your redirect URI in Google Cloud Console exactly matches:
```
https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/callback
```

### Error: "Access blocked: This app's request is invalid"
**Fix:**
1. Check that you've added `supabase.co` to authorized domains in OAuth consent screen
2. Make sure authorized JavaScript origins includes your Supabase URL

### Error: "The app is in testing mode"
**Fix:** This is normal! Your app can still be used by test users. To make it public:
1. Go to OAuth consent screen in Google Cloud Console
2. Click "PUBLISH APP"
3. Submit for verification (required for >100 users)

### Login works locally but not in production
**Fix:**
1. Check Cloudflare environment variables are set
2. Verify your production URL is in Supabase redirect URLs
3. Check browser console for specific errors

---

## Security Notes

✅ **DO:**
- Keep Client Secret secure (never commit to git)
- Use environment variables in production
- Enable Row Level Security (RLS) on Supabase tables
- Add your domain to authorized domains

❌ **DON'T:**
- Commit `SUPABASE_ANON_KEY` to public repos
- Share your Client Secret
- Skip OAuth consent screen configuration
- Use http:// URLs in production

---

## Next Steps

After Google Auth is working:

1. **Add Privacy Policy** - Create `/privacy.html`
2. **Add Terms of Service** - Create `/terms.html`
3. **Test user sync** - Verify user data saves to Supabase
4. **Publish OAuth App** - When ready for public users
5. **Add more providers** - Consider GitHub, Microsoft, etc.

---

## Quick Reference

**Supabase Project ID:** `gdhyukplodnvokrmxvba`

**Supabase URLs:**
- Dashboard: `https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba`
- Auth: `https://gdhyukplodnvokrmxvba.supabase.co/auth/v1`

**Google Cloud:**
- Console: `https://console.cloud.google.com/`
- OAuth Consent: `https://console.cloud.google.com/apis/credentials/consent`
- Credentials: `https://console.cloud.google.com/apis/credentials`

**Cloudflare:**
- Pages Dashboard: `https://dash.cloudflare.com/`
- Wrangler CLI: `npx wrangler pages dev .`
