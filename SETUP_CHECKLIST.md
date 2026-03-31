# 🚀 Wahgola Setup Checklist

Use this checklist to track your Google OAuth setup progress.

---

## ✅ Google Cloud Console

### 1. Create Project
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project named "Wahgola"
- [ ] Select the project

### 2. OAuth Consent Screen
- [ ] Navigate to APIs & Services → OAuth consent screen
- [ ] Select "External" user type
- [ ] Fill in app name: "Wahgola"
- [ ] Add user support email
- [ ] Add authorized domains: `pages.dev` and `supabase.co`
- [ ] Add developer contact email
- [ ] Add scopes: `userinfo.email`, `userinfo.profile`, `openid`
- [ ] Add yourself as test user
- [ ] Save and continue through all steps

### 3. Create OAuth Credentials
- [ ] Navigate to APIs & Services → Credentials
- [ ] Create OAuth client ID (Web application)
- [ ] Name: "Wahgola Web Client"
- [ ] Add authorized JavaScript origin: `https://gdhyukplodnvokrmxvba.supabase.co`
- [ ] Add redirect URI: `https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/callback`
- [ ] Save Client ID: `___________________________`
- [ ] Save Client Secret: `___________________________`

---

## ✅ Supabase Configuration

### 1. Enable Google Provider
- [ ] Go to [Supabase Dashboard](https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba)
- [ ] Navigate to Authentication → Providers
- [ ] Enable "Google" provider
- [ ] Paste Client ID from Google
- [ ] Paste Client Secret from Google
- [ ] Click Save

### 2. Configure URLs
- [ ] Go to Authentication → URL Configuration
- [ ] Set Site URL to your Cloudflare Pages URL
- [ ] Add redirect URLs:
  - [ ] `https://[your-site].pages.dev/dashboard-v2.html`
  - [ ] `https://[your-site].pages.dev/auth/callback`
  - [ ] `http://localhost:8788/dashboard-v2.html`
  - [ ] `http://127.0.0.1:8788/dashboard-v2.html`

### 3. Get Supabase Keys
- [ ] Go to Project Settings → API
- [ ] Copy Supabase URL: `https://gdhyukplodnvokrmxvba.supabase.co`
- [ ] Copy anon public key: `___________________________`

---

## ✅ Wahgola Configuration

### 1. Local Development
- [ ] Copy `config.template.js` to `config.js`
- [ ] Fill in `SUPABASE_ANON_KEY` in `config.js`
- [ ] Verify Mapbox token is present

### 2. Cloudflare Pages (Production)
- [ ] Go to Cloudflare Pages dashboard
- [ ] Navigate to your project → Settings → Environment variables
- [ ] Add variable: `SUPABASE_URL` = `https://gdhyukplodnvokrmxvba.supabase.co`
- [ ] Add variable: `SUPABASE_ANON_KEY` = `[your-anon-key]`
- [ ] Redeploy site

---

## ✅ Testing

### Local Testing
- [ ] Run: `npx wrangler pages dev . --port 8788`
- [ ] Open: `http://localhost:8788/login.html`
- [ ] Click "Continue with Google"
- [ ] Verify Google OAuth popup appears
- [ ] Sign in with test user
- [ ] Verify redirect to dashboard
- [ ] Check that user name/email appears in UI

### Production Testing
- [ ] Deploy to Cloudflare Pages
- [ ] Visit: `https://[your-site].pages.dev/login.html`
- [ ] Test Google sign-in
- [ ] Verify sync works
- [ ] Check browser console for errors

---

## ✅ Post-Setup Tasks

### Optional but Recommended
- [ ] Create `/privacy.html` page
- [ ] Create `/terms.html` page
- [ ] Test trip sync with authenticated user
- [ ] Test logging out and back in
- [ ] Test on mobile device

### When Ready for Public Launch
- [ ] Publish OAuth app in Google Cloud Console
- [ ] Submit for verification (if expecting >100 users)
- [ ] Update OAuth consent screen with final URLs
- [ ] Remove test user restrictions
- [ ] Monitor Supabase auth logs

---

## 📝 Important URLs

**Your Project:**
- Local dev: `http://localhost:8788`
- Production: `https://[your-site].pages.dev`

**Supabase:**
- Dashboard: `https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba`
- Project URL: `https://gdhyukplodnvokrmxvba.supabase.co`

**Google Cloud:**
- Console: `https://console.cloud.google.com/`
- OAuth Consent: `https://console.cloud.google.com/apis/credentials/consent`
- Credentials: `https://console.cloud.google.com/apis/credentials`

---

## 🆘 Common Issues

**Problem:** "redirect_uri_mismatch" error
- **Solution:** Check redirect URI in Google Cloud exactly matches Supabase callback URL

**Problem:** "Access blocked" error
- **Solution:** Add `supabase.co` to authorized domains in OAuth consent screen

**Problem:** Login works locally but not in production
- **Solution:** Verify Cloudflare environment variables are set correctly

**Problem:** "Authentication not available in offline mode" error
- **Solution:** Check that `config.js` has valid Supabase credentials

---

## ✨ Success Criteria

You're done when:
- ✅ Google OAuth popup appears when clicking "Continue with Google"
- ✅ User can sign in and is redirected to dashboard
- ✅ User's name/email displays in the UI
- ✅ Trip data syncs to Supabase when logged in
- ✅ User stays logged in after page refresh
- ✅ Works in both local dev and production

---

**Need help?** See `GOOGLE_AUTH_SETUP.md` for detailed instructions.
