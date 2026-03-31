# ☁️ Cloudflare Pages Environment Variables Setup

Your `.env` file has all the credentials, but Cloudflare Pages needs them set as environment variables.

---

## 🔑 Required Environment Variables

Set these in **Cloudflare Pages Dashboard** → Your Project → **Settings** → **Environment variables**:

### Copy-Paste These Values:
```
SUPABASE_URL=https://gdhyukplodnvokrmxvba.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI4NjQsImV4cCI6MjA5MDQ2ODg2NH0.Ygoi5WlRHbfxdNx7dQzvlPnXkRElTWbOac1LZQZAkm4

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg5Mjg2NCwiZXhwIjoyMDkwNDY4ODY0fQ.cEt3gBApYN4lDykyQMnrwMZE_iH2mBoDpwClIVstOmk
```

---

## 📋 How to Add in Cloudflare

1. Go to: https://dash.cloudflare.com/
2. Click **Pages** → Select your Wahgola project
3. Click **Settings** → **Environment variables**
4. Click **"Add variable"** for each one above
5. Select **Production** environment
6. After adding all, go to **Deployments** → **Retry deployment**

---

## ✅ Test After Deploy

Visit: https://wahgola.zavecoder.com/test-auth.html

This will verify everything is working!
