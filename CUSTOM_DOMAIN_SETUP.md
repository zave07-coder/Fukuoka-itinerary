# 🌐 Custom Domain Setup: wahgola.zavecoder.com

Your custom domain configuration for Google OAuth.

---

## Google Cloud Console Configuration

### Authorized JavaScript Origins
```
https://gdhyukplodnvokrmxvba.supabase.co
```
(Only Supabase URL - your domain is NOT needed here)

### Authorized Redirect URIs
```
https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/callback
```
(Only Supabase callback URL)

### OAuth Consent Screen - Authorized Domains
Add these two domains:
```
zavecoder.com
supabase.co
```

### OAuth Consent Screen - URLs
- **Application home page:** `https://wahgola.zavecoder.com`
- **Privacy policy:** `https://wahgola.zavecoder.com/privacy` (create this later)
- **Terms of service:** `https://wahgola.zavecoder.com/terms` (create this later)

---

## Supabase Configuration

### URL Configuration
1. Go to: https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba
2. Navigate to: **Authentication** → **URL Configuration**

### Site URL
```
https://wahgola.zavecoder.com
```

### Redirect URLs
Add all these URLs (one per line):
```
https://wahgola.zavecoder.com/dashboard-v2.html
https://wahgola.zavecoder.com/auth/callback
https://wahgola.zavecoder.com/*
http://localhost:8788/dashboard-v2.html
http://127.0.0.1:8788/dashboard-v2.html
```

---

## Cloudflare Configuration

### 1. DNS Setup (if not done)
Make sure your DNS points to Cloudflare Pages:
- **Type:** CNAME
- **Name:** wahgola
- **Target:** [your-project].pages.dev
- **Proxy status:** Proxied (orange cloud)

### 2. Custom Domain in Pages
1. Go to Cloudflare Pages dashboard
2. Select your Wahgola project
3. Go to **Custom domains**
4. Add: `wahgola.zavecoder.com`
5. Follow DNS verification steps

### 3. Environment Variables
Make sure these are set:
- `SUPABASE_URL` = `https://gdhyukplodnvokrmxvba.supabase.co`
- `SUPABASE_ANON_KEY` = `[your-anon-key]`

---

## Testing Checklist

### Local Development
- [ ] Test at: `http://localhost:8788/login.html`
- [ ] Google OAuth should work
- [ ] Redirects to `http://localhost:8788/dashboard-v2.html`

### Production
- [ ] Test at: `https://wahgola.zavecoder.com/login.html`
- [ ] Click "Continue with Google"
- [ ] Should redirect to Google OAuth
- [ ] After login, redirects to: `https://wahgola.zavecoder.com/dashboard-v2.html`
- [ ] User name appears in UI
- [ ] Trips sync to Supabase

---

## Important Notes

### SSL/HTTPS
✅ Your domain MUST use HTTPS (Cloudflare handles this automatically)

### Wildcard Redirect
The `https://wahgola.zavecoder.com/*` in Supabase redirect URLs allows any path on your domain.

### Testing Mode
While your OAuth app is in "Testing" mode in Google Cloud Console:
- Only test users (emails you added) can sign in
- This is normal and expected
- Works fine for development

### Publishing Your App
When ready for public users (>100 people):
1. Go to Google Cloud Console → OAuth consent screen
2. Click "PUBLISH APP"
3. Submit for verification (Google will review)

---

## Quick Reference

**Your Production URL:**
```
https://wahgola.zavecoder.com
```

**Login Page:**
```
https://wahgola.zavecoder.com/login.html
```

**Dashboard:**
```
https://wahgola.zavecoder.com/dashboard-v2.html
```

**Supabase Project:**
```
https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba
```

---

## Auth Flow with Custom Domain

```
User visits
https://wahgola.zavecoder.com/login.html
         ↓
Clicks "Continue with Google"
         ↓
Redirected to Supabase Auth
https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/authorize
         ↓
Redirected to Google OAuth
https://accounts.google.com/o/oauth2/v2/auth
         ↓
User signs in with Google
         ↓
Google redirects back to Supabase
https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/callback
         ↓
Supabase redirects to your dashboard
https://wahgola.zavecoder.com/dashboard-v2.html
         ↓
User is logged in! ✨
```

---

## Troubleshooting

### "redirect_uri_mismatch" Error
**Fix:** Make sure Google Cloud Console redirect URI is EXACTLY:
```
https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/callback
```

### "Access blocked: This app's request is invalid"
**Fix:** Add `zavecoder.com` to authorized domains in OAuth consent screen

### Login works but redirects to wrong URL
**Fix:** Check Site URL in Supabase matches `https://wahgola.zavecoder.com`

### SSL/HTTPS errors
**Fix:** Make sure Cloudflare proxy is enabled (orange cloud in DNS)

---

Ready to test! 🚀
