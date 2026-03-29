# WayWeave Technical Architecture

**Last Updated:** March 29, 2026
**Current State:** Phase 0 (Single-trip viewer)
**Target State:** Phase 1B+ (Multi-trip with cloud sync)

---

## 🏗️ System Overview

WayWeave is a **local-first, progressively enhanced travel planning application** built on Cloudflare Pages with Neon PostgreSQL for authenticated user data.

**Core Principles:**
1. **Local-first:** All data stored in localStorage initially (zero network dependency)
2. **Progressive enhancement:** Features unlock as user authenticates
3. **Mobile-first:** Responsive design from day one
4. **Zero build step:** Vanilla JS for fast iteration (Phase 1-2)

---

## 📊 Current Architecture (Phase 0)

```
┌─────────────────────────────────────────────────────┐
│              Cloudflare Pages                       │
│         (Static Hosting + Edge Functions)           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Static Assets:                                     │
│  ├─ index.html → Trip Viewer                        │
│  ├─ styles.css → Base styles                        │
│  ├─ split-screen.css → Layout (map + itinerary)     │
│  ├─ mobile.css → Responsive design (2048 lines)     │
│  ├─ version-control.css → Undo/redo toolbar         │
│  ├─ script.js → AI editing logic                    │
│  └─ split-screen-sync.js → Map ↔ itinerary sync     │
│                                                      │
│  Edge Function:                                     │
│  └─ _worker.js → API Proxy (OpenAI chat endpoint)   │
│                                                      │
└─────────────────────────────────────────────────────┘
              ↓ (API calls)
┌─────────────────────────────────────────────────────┐
│              OpenAI API                             │
│              (GPT-4o-mini)                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│        Neon PostgreSQL (unused currently)           │
└─────────────────────────────────────────────────────┘
```

### **Data Flow (Current):**

```
1. User loads index.html
   ↓
2. Hardcoded trip data in script.js
   ↓
3. Renders split-screen: Map (Mapbox) + Itinerary (DOM)
   ↓
4. User clicks "AI Edit Day 3"
   ↓
5. JavaScript sends prompt to _worker.js
   ↓
6. Worker proxies to OpenAI API
   ↓
7. AI returns JSON with suggested edits
   ↓
8. Shows preview modal with checkboxes
   ↓
9. User selects changes → Applies to DOM
   ↓
10. No persistence (refreshing page loses edits)
```

---

## 🎯 Target Architecture (Phase 1B+)

```
┌──────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                          │
│              (Static Hosting + Edge Workers)                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Pages:                                                      │
│  ├─ dashboard.html → Trip Grid (Guest + Auth)                │
│  ├─ trip.html → Trip Viewer (from index.html)                │
│  ├─ share.html → Public Trip Viewer (Phase 3)                │
│  └─ auth-callback.html → OAuth redirect handler              │
│                                                               │
│  Styles:                                                     │
│  ├─ styles.css → Base styles                                 │
│  ├─ dashboard.css → Card grid layout                         │
│  ├─ split-screen.css → Map + itinerary                       │
│  ├─ mobile.css → Responsive (2048 lines)                     │
│  └─ version-control.css → Undo/redo toolbar                  │
│                                                               │
│  JavaScript Modules:                                         │
│  ├─ trip-manager.js → localStorage CRUD                      │
│  ├─ auth.js → Supabase Auth wrapper                         │
│  ├─ sync.js → localStorage ↔ DB sync                         │
│  ├─ ai.js → AI generation/editing                           │
│  ├─ map.js → Mapbox GL initialization                        │
│  └─ utils.js → Shared utilities                             │
│                                                               │
│  Edge Worker (_worker.js):                                  │
│  ├─ POST /api/chat → OpenAI proxy (AI editing)               │
│  ├─ POST /api/auth/callback → Supabase OAuth handler        │
│  ├─ GET /api/trips → List user's trips                       │
│  ├─ POST /api/trips → Create trip                            │
│  ├─ GET /api/trips/:id → Get trip details                    │
│  ├─ PUT /api/trips/:id → Update trip                         │
│  ├─ DELETE /api/trips/:id → Delete trip                      │
│  └─ POST /api/sync → Sync localStorage → DB                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
              ↓                    ↓
┌─────────────────────┐  ┌──────────────────────────┐
│   Supabase Auth     │  │   Neon PostgreSQL        │
│  (OAuth Provider)   │  │   (User Data)            │
├─────────────────────┤  ├──────────────────────────┤
│ - Google OAuth      │  │ - users table            │
│ - Apple Sign-In     │  │ - trips table            │
│ - Email/Password    │  │ - JSONB itinerary data   │
│ - JWT tokens        │  │                          │
└─────────────────────┘  └──────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────┐
│                   OpenAI API                         │
│                (GPT-4o-mini for AI editing)          │
└──────────────────────────────────────────────────────┘
```

### **Data Flow (Phase 1B):**

```
GUEST MODE (No Auth):
1. User visits wayweave.io
   ↓
2. dashboard.html loads → Shows trip grid from localStorage
   ↓
3. User creates trip → Saved to localStorage
   ↓
4. After 5 min → Banner prompts: "Save to cloud?"
   ↓
5. If dismissed → Data stays in localStorage only
   ↓
6. If browser clears cache → Data lost (user warned)

AUTHENTICATED MODE:
1. User clicks "Continue with Google"
   ↓
2. Redirects to Supabase OAuth → Returns JWT token
   ↓
3. JavaScript calls POST /api/sync
   ↓
4. Worker uploads all localStorage trips to Neon DB
   ↓
5. Future edits auto-sync every 30 seconds
   ↓
6. localStorage becomes cache (for offline access)
   ↓
7. Multi-device: Edit on laptop → Sync → See on phone
```

---

## 💾 Data Models

### **localStorage Structure (Phase 1A)**

```javascript
// Key: "wayweave_trips"
{
  "version": "1.0", // Schema version for migrations
  "trips": [
    {
      "id": "1711726800000-abc123", // timestamp-uuid
      "name": "Fukuoka Family Adventure",
      "destination": "Fukuoka, Japan",
      "startDate": "2026-06-14",
      "endDate": "2026-06-23",
      "coverImage": "https://images.unsplash.com/photo-fukuoka...",
      "days": [
        {
          "dayNumber": 1,
          "date": "2026-06-14",
          "title": "Arrival & Settling In",
          "activities": [
            {
              "id": "act-1",
              "time": "01:20 AM",
              "title": "Depart Singapore (SIN)",
              "description": "Singapore Airlines SQ 656...",
              "location": {
                "name": "Changi Terminal 2",
                "address": "Airport Blvd, Singapore 819643",
                "coordinates": [103.9915, 1.3644]
              },
              "type": "flight", // flight, activity, meal, hotel
              "metadata": {
                "duration": "6h 0m",
                "airline": "Singapore Airlines",
                "flightNumber": "SQ656"
              }
            }
            // ... more activities
          ]
        }
        // ... more days
      ],
      "metadata": {
        "travelers": 3,
        "budget": "medium",
        "interests": ["family", "culture", "food"],
        "aiGenerated": false, // true if created via AI
        "template": null // template ID if used
      },
      "createdAt": "2026-03-29T10:00:00.000Z",
      "updatedAt": "2026-03-29T15:30:00.000Z"
    }
    // ... more trips
  ],
  "currentTripId": "1711726800000-abc123",
  "settings": {
    "theme": "light", // light, dark, auto
    "autoSave": true,
    "syncInterval": 30000, // 30 seconds
    "mapProvider": "mapbox", // mapbox, google (future)
    "measurementUnit": "metric" // metric, imperial
  }
}

// Key: "wayweave_history" (undo/redo stack)
{
  "currentTripId": "1711726800000-abc123",
  "history": [
    {
      "timestamp": "2026-03-29T15:30:00.000Z",
      "action": "edit",
      "target": "day-3-activity-2",
      "before": {...}, // Previous state
      "after": {...}   // New state
    }
  ],
  "currentIndex": 5, // Pointer in history array
  "maxHistory": 50 // Limit to prevent localStorage bloat
}

// Key: "wayweave_auth" (auth state)
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://..."
  },
  "expiresAt": "2026-04-05T10:00:00.000Z"
}
```

### **Neon PostgreSQL Schema (Phase 1B)**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  auth_provider TEXT NOT NULL, -- 'google', 'email', 'apple'
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}', -- User settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  cover_image TEXT,

  -- Full itinerary data (stored as JSONB)
  data JSONB NOT NULL,
  /* data structure:
  {
    "days": [...],
    "metadata": {
      "travelers": 3,
      "budget": "medium",
      "interests": ["culture", "food"],
      "aiGenerated": true,
      "template": "kyoto-5day-cultural"
    }
  }
  */

  -- Sharing (Phase 3)
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,

  -- Collaboration (Phase 3)
  collaborators JSONB DEFAULT '[]',
  /* collaborators structure:
  [
    {
      "userId": "uuid",
      "email": "collaborator@example.com",
      "role": "editor", // editor, viewer
      "addedAt": "2026-05-01T10:00:00.000Z"
    }
  ]
  */

  -- Metadata
  version INTEGER DEFAULT 1, -- For schema migrations
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_updated_at ON trips(user_id, updated_at DESC);
CREATE INDEX idx_trips_share_token ON trips(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_trips_public ON trips(is_public) WHERE is_public = true;

-- GIN index for JSONB queries (search by destination, interests, etc.)
CREATE INDEX idx_trips_data_gin ON trips USING GIN (data);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Templates table (Phase 2)
CREATE TABLE templates (
  id TEXT PRIMARY KEY, -- e.g., "kyoto-5day-cultural"
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration INTEGER NOT NULL, -- Days
  category TEXT, -- cultural, adventure, relaxation, etc.
  tags TEXT[], -- ["temples", "gardens", "tea ceremony"]
  cover_image TEXT,
  description TEXT,
  difficulty TEXT, -- easy, moderate, adventurous
  budget TEXT, -- budget, medium, luxury
  data JSONB NOT NULL, -- Template itinerary structure
  creator_id UUID REFERENCES users(id), -- NULL for official templates
  is_official BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0, -- Track popularity
  rating NUMERIC(3,2), -- Average rating (1.00-5.00)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_destination ON templates(destination);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_usage ON templates(usage_count DESC);
CREATE INDEX idx_templates_rating ON templates(rating DESC);

-- Comments table (Phase 3 - Collaboration)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES comments(id), -- For threaded replies

  -- Comment target
  target_type TEXT NOT NULL, -- 'day', 'activity', 'trip'
  target_id TEXT NOT NULL, -- e.g., "day-3", "activity-5"

  -- Content
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_trip_id ON comments(trip_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_target ON comments(target_type, target_id);
```

---

## 🔌 API Endpoints

### **Phase 1A: Static Only**
No API endpoints needed (everything in localStorage)

### **Phase 1B: Auth + Sync**

```javascript
// _worker.js

// ============================================
// AUTH ENDPOINTS
// ============================================

// Handle Supabase OAuth callback
POST /api/auth/callback
Request Headers:
  Authorization: Bearer <supabase-jwt>
Request Body: None
Response:
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://..."
    },
    "token": "jwt-token",
    "expiresAt": "2026-04-05T10:00:00.000Z"
  }

// ============================================
// TRIP CRUD ENDPOINTS
// ============================================

// List user's trips
GET /api/trips
Request Headers:
  Authorization: Bearer <jwt>
Query Params:
  ?sort=recent|alphabetical|upcoming
  ?limit=20
  ?offset=0
Response:
  {
    "trips": [
      {
        "id": "uuid",
        "name": "Fukuoka Family Adventure",
        "destination": "Fukuoka, Japan",
        "startDate": "2026-06-14",
        "endDate": "2026-06-23",
        "coverImage": "https://...",
        "dayCount": 10,
        "createdAt": "2026-03-29T10:00:00.000Z",
        "updatedAt": "2026-03-29T15:30:00.000Z"
      }
      // ... more trips
    ],
    "total": 42,
    "hasMore": true
  }

// Get single trip details
GET /api/trips/:id
Request Headers:
  Authorization: Bearer <jwt>
Response:
  {
    "trip": {
      "id": "uuid",
      "name": "Fukuoka Family Adventure",
      "destination": "Fukuoka, Japan",
      "startDate": "2026-06-14",
      "endDate": "2026-06-23",
      "coverImage": "https://...",
      "data": {
        "days": [...],
        "metadata": {...}
      },
      "createdAt": "2026-03-29T10:00:00.000Z",
      "updatedAt": "2026-03-29T15:30:00.000Z"
    }
  }

// Create new trip
POST /api/trips
Request Headers:
  Authorization: Bearer <jwt>
Request Body:
  {
    "name": "Kyoto Cultural Tour",
    "destination": "Kyoto, Japan",
    "startDate": "2026-07-01",
    "endDate": "2026-07-05",
    "coverImage": "https://...",
    "data": {
      "days": [],
      "metadata": {
        "travelers": 2,
        "budget": "medium",
        "interests": ["temples", "gardens"]
      }
    }
  }
Response:
  {
    "trip": {...}, // Full trip object
    "id": "uuid"
  }

// Update trip
PUT /api/trips/:id
Request Headers:
  Authorization: Bearer <jwt>
Request Body:
  {
    "name": "Updated Trip Name",
    "data": {...} // Full or partial update
  }
Response:
  {
    "trip": {...}, // Updated trip object
    "updatedAt": "2026-03-29T16:00:00.000Z"
  }

// Delete trip
DELETE /api/trips/:id
Request Headers:
  Authorization: Bearer <jwt>
Response:
  {
    "success": true,
    "deletedId": "uuid"
  }

// ============================================
// SYNC ENDPOINT
// ============================================

// Sync localStorage trips to cloud (on first auth)
POST /api/sync
Request Headers:
  Authorization: Bearer <jwt>
Request Body:
  {
    "trips": [
      {
        "id": "local-id-1", // localStorage ID
        "name": "Trip 1",
        "data": {...}
      }
      // ... all localStorage trips
    ]
  }
Response:
  {
    "synced": 3,
    "mapping": {
      "local-id-1": "server-uuid-1",
      "local-id-2": "server-uuid-2"
    }
  }

// ============================================
// AI ENDPOINTS (existing)
// ============================================

// AI chat for editing
POST /api/chat
Request Headers:
  Authorization: Bearer <jwt> (optional for guest mode)
Request Body:
  {
    "prompt": "Make Day 3 more kid-friendly",
    "context": {
      "tripId": "uuid",
      "dayNumber": 3,
      "currentActivities": [...]
    }
  }
Response:
  {
    "suggestions": [
      {
        "type": "modify",
        "target": "activity-2",
        "before": {...},
        "after": {...},
        "reason": "Better for kids, interactive exhibits"
      }
    ]
  }
```

### **Phase 2: Templates**

```javascript
// Get template list
GET /api/templates
Query Params:
  ?destination=kyoto
  ?duration=5
  ?category=cultural
  ?sort=popular|recent|rating
Response:
  {
    "templates": [
      {
        "id": "kyoto-5day-cultural",
        "name": "5-Day Kyoto Cultural Experience",
        "destination": "Kyoto, Japan",
        "duration": 5,
        "category": "cultural",
        "tags": ["temples", "gardens", "tea ceremony"],
        "coverImage": "https://...",
        "description": "Explore ancient temples...",
        "difficulty": "easy",
        "budget": "medium",
        "usageCount": 1234,
        "rating": 4.7
      }
    ]
  }

// Get template details
GET /api/templates/:id
Response:
  {
    "template": {
      "id": "kyoto-5day-cultural",
      "data": {
        "days": [...] // Full template itinerary
      }
    }
  }

// Use template (creates trip from template)
POST /api/trips/from-template
Request Headers:
  Authorization: Bearer <jwt>
Request Body:
  {
    "templateId": "kyoto-5day-cultural",
    "customizations": {
      "name": "My Kyoto Trip",
      "startDate": "2026-07-01"
    }
  }
Response:
  {
    "trip": {...} // New trip created from template
  }
```

### **Phase 3: Sharing**

```javascript
// Generate share link
POST /api/trips/:id/share
Request Headers:
  Authorization: Bearer <jwt>
Request Body:
  {
    "isPublic": true, // Show in public gallery
    "allowDuplicate": true
  }
Response:
  {
    "shareUrl": "https://wayweave.io/share/abc123xyz",
    "shareToken": "abc123xyz"
  }

// Get shared trip (no auth required)
GET /api/share/:token
Response:
  {
    "trip": {...}, // Full trip data (read-only)
    "creator": {
      "name": "John Doe",
      "avatar": "https://..."
    },
    "allowDuplicate": true
  }

// Duplicate shared trip to user's account
POST /api/share/:token/duplicate
Request Headers:
  Authorization: Bearer <jwt>
Response:
  {
    "trip": {...}, // New trip in user's account
    "originalCreator": "John Doe"
  }
```

---

## 🔒 Security & Authentication

### **Supabase Auth Flow**

```javascript
// 1. User clicks "Continue with Google"
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://wayweave.io/auth/callback'
  }
});

// 2. Google OAuth → User consents → Redirects back

// 3. auth-callback.html handles redirect
const { data: { session }, error } = await supabase.auth.getSession();
const jwt = session.access_token;

// 4. Store JWT in localStorage
localStorage.setItem('wayweave_auth', JSON.stringify({
  token: jwt,
  user: session.user,
  expiresAt: session.expires_at
}));

// 5. All API calls include JWT
fetch('/api/trips', {
  headers: {
    'Authorization': `Bearer ${jwt}`
  }
});

// 6. Worker validates JWT with Supabase
const user = await supabase.auth.getUser(jwt);
if (!user) {
  return new Response('Unauthorized', { status: 401 });
}
```

### **Authorization Levels**

```javascript
// Guest (no auth): Can create/edit trips in localStorage only
// Authenticated: Can sync to cloud, access from any device
// Premium: Unlimited trips, collaboration, export features

// Row-Level Security (RLS) in Neon
-- Users can only access their own trips
CREATE POLICY trips_user_access ON trips
  FOR ALL
  USING (user_id = current_user_id());

-- Collaborators can access shared trips
CREATE POLICY trips_collaborator_access ON trips
  FOR SELECT
  USING (
    data->'collaborators' @> jsonb_build_array(
      jsonb_build_object('userId', current_user_id())
    )
  );

-- Public trips readable by anyone
CREATE POLICY trips_public_access ON trips
  FOR SELECT
  USING (is_public = true);
```

---

## 🚀 Performance Optimizations

### **Lazy Loading**
```javascript
// Dashboard: Only load trip metadata (not full itinerary)
GET /api/trips → Returns lightweight trip list

// Trip viewer: Load full itinerary on demand
GET /api/trips/:id → Returns complete trip data

// Images: Use Cloudflare Image Resizing
<img src="https://wayweave.io/cdn-cgi/image/width=400,quality=80/trip-cover.jpg">
```

### **Caching Strategy**
```javascript
// Service Worker (Phase 4 - Offline Mode)
self.addEventListener('fetch', (event) => {
  // Cache trip data for offline access
  if (event.request.url.includes('/api/trips/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// localStorage as cache (Phase 1B)
// Keep synced copy of cloud data for instant access
localStorage: {
  "wayweave_trips": [...], // Local copy
  "wayweave_trips_synced_at": "2026-03-29T16:00:00.000Z"
}

// Invalidate cache on sync
if (serverUpdatedAt > localStorage.syncedAt) {
  // Fetch fresh data from server
}
```

### **Database Optimization**
```sql
-- Use JSONB operators for fast queries
-- Find trips to Kyoto
SELECT * FROM trips
WHERE data->'metadata'->>'destination' = 'Kyoto, Japan';

-- Find trips with "cultural" interest
SELECT * FROM trips
WHERE data->'metadata'->'interests' ? 'cultural';

-- GIN index makes these queries fast (milliseconds, not seconds)
```

---

## 🛠️ Tech Stack Decisions

### **Why Vanilla JS (not React)?**

**Pros:**
- ✅ Zero build step (instant iteration)
- ✅ Smaller bundle size (faster mobile load)
- ✅ Less complexity (easier to maintain solo)
- ✅ Already proven with current app
- ✅ No framework lock-in

**Cons:**
- ❌ Manual DOM manipulation (more code)
- ❌ No component reusability
- ❌ Harder state management at scale

**Decision:** Keep vanilla JS for Phase 1-2
- Revisit for Phase 5 (native mobile likely uses React Native anyway)
- If codebase becomes too complex, migrate to lightweight framework (Preact, Alpine.js)

### **Why Supabase Auth (not custom)?**

**Pros:**
- ✅ Pre-built OAuth (Google, Apple, GitHub)
- ✅ JWT tokens work seamlessly with Neon
- ✅ Excellent docs and DX
- ✅ Free tier generous (50,000 MAU)
- ✅ Simple migration path to self-hosted (open-source)

**Cons:**
- ❌ Vendor dependency
- ❌ Additional service (adds complexity)

**Decision:** Use Supabase Auth for Phase 1B+
- Can self-host later if needed (Supabase is open-source)
- Faster to market than building custom auth

### **Why Neon PostgreSQL (not Supabase DB)?**

**Pros:**
- ✅ Serverless (scales to zero, pay for what you use)
- ✅ Generous free tier (0.5 GB storage, 1M queries/month)
- ✅ Fast cold starts (<1 second)
- ✅ Works well with Cloudflare Workers
- ✅ JSONB support for flexible itinerary storage

**Cons:**
- ❌ Separate service from auth (more complexity)
- ❌ Less integrated than all-in-one Supabase

**Decision:** Keep Neon for database
- Already set up in current project
- Cheaper than Supabase at scale (pricing is per-query, not per-user)

### **Why localStorage-first (not cloud-first)?**

**Pros:**
- ✅ Zero friction for guests (no auth wall)
- ✅ Works offline by default
- ✅ Instant saves (no network latency)
- ✅ Progressive enhancement (features unlock with auth)

**Cons:**
- ❌ Data loss if user clears cache
- ❌ No multi-device sync without auth
- ❌ localStorage quota limits (5-10 MB per domain)

**Decision:** localStorage-first for Phase 1A
- Prompt auth after 5 min to prevent data loss
- Warn users about cache clearing risk
- localStorage becomes cache layer after auth (Phase 1B)

---

## 📦 Deployment Pipeline

### **Current (Phase 0):**
```bash
# Push to GitHub → Cloudflare Pages auto-deploys
git push origin main

# Cloudflare Pages:
# - Builds static site
# - Deploys _worker.js as edge function
# - Live at https://fkk.zavecoder.com
```

### **Future (Phase 1B+):**
```bash
# Local development
npm run dev → Runs Cloudflare Wrangler locally

# Staging
git push origin staging → Deploys to staging.wayweave.io

# Production
git tag v1.0.0 → Deploys to wayweave.io

# Database migrations (Neon)
npm run migrate → Applies SQL migrations to Neon DB
```

---

## 🧪 Testing Strategy

### **Phase 1A (Manual Testing):**
- Browser testing: Chrome, Safari, Firefox, Mobile Safari
- localStorage edge cases: Quota exceeded, corrupt data, cleared cache
- Multi-trip scenarios: Create 10 trips, delete, duplicate, search

### **Phase 1B (Integration Testing):**
- Auth flow: OAuth redirect, token refresh, logout
- Sync: localStorage → DB, conflict resolution, multi-device
- API: CRUD operations, error handling, rate limiting

### **Phase 2+ (Automated Testing):**
- Unit tests: trip-manager.js, sync.js, ai.js
- Integration tests: API endpoints, auth flow
- E2E tests: Playwright for critical user flows

---

## 🚨 Error Handling

### **localStorage Errors:**
```javascript
// Quota exceeded
try {
  localStorage.setItem('wayweave_trips', JSON.stringify(trips));
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    showWarning('Storage full! Authenticate to save to cloud.');
  }
}

// Corrupt data recovery
try {
  const trips = JSON.parse(localStorage.getItem('wayweave_trips'));
} catch (e) {
  console.error('Corrupt localStorage data, resetting...');
  localStorage.removeItem('wayweave_trips');
  showError('Your trips data was corrupted. Please re-create your trips.');
}
```

### **Network Errors:**
```javascript
// Retry logic for API calls
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

### **AI Generation Errors:**
```javascript
// OpenAI API failures
try {
  const aiResponse = await fetch('/api/chat', {...});
  const data = await aiResponse.json();
} catch (error) {
  showError('AI generation failed. Please try again.');
  // Fallback: Offer to create blank trip instead
}

// Invalid AI response (malformed JSON)
if (!isValidItineraryJSON(data)) {
  showError('AI returned invalid data. Regenerating...');
  // Retry with more explicit prompt
}
```

---

## 📊 Monitoring & Analytics

### **Phase 1A:**
- Google Analytics 4 (basic page views, events)
- Cloudflare Analytics (traffic, errors)
- Manual bug reports

### **Phase 1B+:**
- Sentry (error tracking, performance monitoring)
- PostHog (product analytics, feature flags)
- Cloudflare Web Analytics (privacy-friendly)

**Key Metrics to Track:**
- API latency (p50, p95, p99)
- Error rate (5xx errors)
- Auth conversion rate (guest → authenticated)
- Sync success rate
- Trip creation funnel

---

## 🔄 Migration Strategy

### **localStorage Schema Versioning:**
```javascript
// Detect old schema and migrate
const data = JSON.parse(localStorage.getItem('wayweave_trips'));
if (data.version === '0.9') {
  // Migrate from v0.9 to v1.0
  data.trips = data.trips.map(trip => ({
    ...trip,
    metadata: {
      travelers: trip.travelers || 1,
      budget: trip.budget || 'medium',
      interests: trip.tags || []
    }
  }));
  data.version = '1.0';
  localStorage.setItem('wayweave_trips', JSON.stringify(data));
}
```

### **Database Migrations:**
```sql
-- Example: Add "favorites" feature in Phase 2
ALTER TABLE trips
ADD COLUMN is_favorite BOOLEAN DEFAULT false;

CREATE INDEX idx_trips_favorite ON trips(user_id, is_favorite)
WHERE is_favorite = true;
```

---

## 🎯 Next Steps

### **Immediate (Phase 1A - This Week):**
1. Create `dashboard.html` + `dashboard.css`
2. Implement `trip-manager.js` (localStorage CRUD)
3. Build new trip modal with 3 options
4. Test multi-trip scenarios

### **Short-term (Phase 1B - Weeks 3-4):**
1. Set up Supabase Auth project
2. Create database schema in Neon
3. Implement sync logic
4. Test auth flow end-to-end

### **Medium-term (Phase 2 - Weeks 5-6):**
1. Create 10 Japan city templates
2. Build template gallery UI
3. Implement AI prompt builder
4. Test progressive generation

**For detailed timeline, see [ROADMAP.md](./ROADMAP.md)**
