# 🔐 Wahgola Authentication Flow

Visual guide to understand how Google OAuth works in Wahgola.

---

## The Big Picture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   User      │      │   Wahgola    │      │  Supabase   │      │   Google     │
│  Browser    │      │   (Client)   │      │   Auth      │      │   OAuth      │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘      └──────┬───────┘
       │                    │                     │                     │
       │  1. Click "Sign   │                     │                     │
       │     with Google"   │                     │                     │
       ├───────────────────>│                     │                     │
       │                    │                     │                     │
       │                    │  2. Request OAuth  │                     │
       │                    │     redirect        │                     │
       │                    ├────────────────────>│                     │
       │                    │                     │                     │
       │                    │                     │  3. Redirect to    │
       │                    │                     │     Google login   │
       │                    │                     ├────────────────────>│
       │                    │                     │                     │
       │                    │                     │                     │
       │  4. Google OAuth popup                   │                     │
       │<────────────────────────────────────────────────────────────────┤
       │                    │                     │                     │
       │  5. User enters    │                     │                     │
       │     credentials    │                     │                     │
       ├────────────────────────────────────────────────────────────────>│
       │                    │                     │                     │
       │                    │                     │  6. Google sends   │
       │                    │                     │     auth code      │
       │                    │                     │<────────────────────┤
       │                    │                     │                     │
       │                    │                     │  7. Exchange code  │
       │                    │                     │     for tokens     │
       │                    │                     ├────────────────────>│
       │                    │                     │<────────────────────┤
       │                    │                     │                     │
       │  8. Redirect to    │                     │                     │
       │     dashboard      │                     │                     │
       │<────────────────────────────────────────┤                     │
       │                    │                     │                     │
       │  9. Request user   │                     │                     │
       │     data           │                     │                     │
       ├───────────────────>│                     │                     │
       │                    │                     │                     │
       │                    │  10. Get session   │                     │
       │                    ├────────────────────>│                     │
       │                    │<────────────────────┤                     │
       │                    │                     │                     │
       │  11. Show user     │                     │                     │
       │      profile       │                     │                     │
       │<───────────────────┤                     │                     │
       │                    │                     │                     │
```

---

## Key URLs in the Flow

### 1. Wahgola Login Page
```
https://[your-site].pages.dev/login.html
```
Where user clicks "Continue with Google"

### 2. Supabase Auth Endpoint
```
https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/authorize
```
Initiates OAuth flow

### 3. Google OAuth Consent
```
https://accounts.google.com/o/oauth2/v2/auth
```
Google's login popup

### 4. Supabase Callback
```
https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/callback
```
Where Google sends the auth code

### 5. Redirect to Dashboard
```
https://[your-site].pages.dev/dashboard-v2.html
```
User lands here after successful auth

---

## Data Flow

### What Google Provides
```json
{
  "id": "google-user-id-12345",
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "email_verified": true
}
```

### What Supabase Stores
```json
{
  "id": "uuid-generated-by-supabase",
  "email": "user@gmail.com",
  "user_metadata": {
    "name": "John Doe",
    "avatar_url": "https://lh3.googleusercontent.com/...",
    "email_verified": true,
    "provider": "google"
  },
  "app_metadata": {
    "provider": "google",
    "providers": ["google"]
  }
}
```

### What Wahgola Gets
```javascript
const user = {
  id: "uuid-generated-by-supabase",
  email: "user@gmail.com",
  user_metadata: {
    name: "John Doe",
    avatar_url: "https://...",
  }
}
```

---

## Security Layers

### 1. Google OAuth (First Layer)
- ✅ User authenticates with Google password
- ✅ Google verifies user identity
- ✅ Google asks for consent (first time only)

### 2. Supabase Auth (Second Layer)
- ✅ Validates OAuth tokens from Google
- ✅ Creates/updates user in Supabase
- ✅ Issues JWT session token to client
- ✅ Manages session expiry/refresh

### 3. Wahgola Client (Third Layer)
- ✅ Stores session in localStorage (encrypted)
- ✅ Validates session on every page load
- ✅ Refreshes expired tokens automatically

### 4. Database (Fourth Layer)
- ✅ Row Level Security (RLS) on tables
- ✅ Users can only access their own data
- ✅ Auth policies enforce permissions

---

## Configuration Chain

### Google Cloud Console
```
Client ID + Client Secret
         ↓
```

### Supabase Dashboard
```
Provider Settings
         ↓
```

### Wahgola Code
```javascript
// Client-side auth
authService.signInWithGoogle()
         ↓
// Opens Google OAuth popup
         ↓
// Callback handled by Supabase
         ↓
// User session created
         ↓
// Redirect to dashboard
```

---

## What Happens After Login

### On Dashboard Load
```javascript
// 1. Check for existing session
const { data: { session } } = await supabase.auth.getSession()

// 2. If session exists, get user
if (session) {
  const user = session.user

  // 3. Display user info in UI
  document.getElementById('userName').textContent = user.user_metadata.name

  // 4. Enable sync functionality
  await syncService.sync()
}
```

### On Trip Save
```javascript
// 1. Check if user is logged in
if (authService.currentUser) {
  // 2. Save to Supabase
  await supabase
    .from('trips')
    .insert({
      user_id: authService.currentUser.id,
      data: tripData
    })
}

// 3. Always save to localStorage (local-first)
localStorage.setItem('wahgola_trips', JSON.stringify(trips))
```

---

## Session Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│ User Session Timeline                                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Login                    Session Active              Logout│
│    │                            │                       │   │
│    ▼                            ▼                       ▼   │
│  ┌───┐                       ┌───┐                   ┌───┐ │
│  │ 0h│                       │24h│                   │48h│ │
│  └───┘                       └───┘                   └───┘ │
│                                                             │
│  ├─────────── Access Token ────────────┤                   │
│                             ├────── Refresh Token ──────┤  │
│                                                             │
│  [JWT in localStorage]      [Auto-refresh]    [Manual     │
│  [Validated on each         [Happens at       logout or   │
│   page load]                 24h mark]         expiry]    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Token Expiry:**
- **Access Token:** 1 hour (short-lived, secure)
- **Refresh Token:** 7 days (can extend session)
- **Session:** Persists until logout or token expiry

**Auto-Refresh:**
Supabase SDK automatically refreshes tokens before expiry, so users stay logged in.

---

## Troubleshooting Visual

```
Problem: Login button doesn't work
         ↓
Check 1: Is config.js set up? → No → Add SUPABASE_CONFIG
         ↓ Yes
Check 2: Console errors? → Yes → Fix error
         ↓ No
Check 3: Supabase provider enabled? → No → Enable in dashboard
         ↓ Yes
Check 4: Google credentials valid? → No → Re-create OAuth client
         ↓ Yes
Should work! ✅

─────────────────────────────────────────────────────────────

Problem: "redirect_uri_mismatch" error
         ↓
Check: Authorized redirect URIs in Google Cloud Console
         ↓
Must be exactly: https://gdhyukplodnvokrmxvba.supabase.co/auth/v1/callback
         ↓
Match? → No → Update Google Cloud settings
         ↓ Yes
Check: Authorized domain includes "supabase.co"
         ↓
Includes? → No → Add to OAuth consent screen
         ↓ Yes
Should work! ✅

─────────────────────────────────────────────────────────────

Problem: Works locally but not in production
         ↓
Check: Cloudflare environment variables set?
         ↓
SUPABASE_URL → Must match exactly
SUPABASE_ANON_KEY → Must be valid
         ↓
Check: Production URL in Supabase redirect URLs?
         ↓
Added? → No → Add to Supabase URL Configuration
         ↓ Yes
Check: Deployed latest code?
         ↓
Deploy → git push
         ↓
Should work! ✅
```

---

## Summary: The Three Keys

**For auth to work, you need:**

1. **Google OAuth credentials** (Client ID + Secret)
   - Created in Google Cloud Console
   - Added to Supabase

2. **Supabase configuration** (URL + Anon Key)
   - Added to config.js (local)
   - Added to Cloudflare env vars (production)

3. **Correct redirect URIs**
   - In Google: Supabase callback URL
   - In Supabase: Your dashboard URL

**That's it!** 🎉

---

Need more help? See:
- `QUICK_START_AUTH.md` - 5-minute setup
- `GOOGLE_AUTH_SETUP.md` - Detailed guide
- `SETUP_CHECKLIST.md` - Step-by-step checklist
