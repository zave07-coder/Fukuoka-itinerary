# Sync Troubleshooting Guide

## Overview

The Wahgola app has a **cross-device sync system** that synchronizes trips between:
- **localStorage** (browser local storage)
- **Supabase Cloud** (PostgreSQL database)

## Current Status ✅

Based on the diagnostic check:
- ✅ **users** table: EXISTS (1 user)
- ✅ **trips** table: EXISTS (0 trips)
- ✅ **sync_metadata** table: EXISTS
- ⚠️  **poi_images** table: MISSING (optional, only for POI image caching)

**Finding**: The sync infrastructure is set up correctly. If trips aren't syncing, it's likely a client-side issue.

---

## Common Sync Issues & Solutions

### 1. "Trips not syncing to cloud"

**Symptoms:**
- Dashboard shows trips locally
- Trips don't appear in Supabase `trips` table
- Sync status shows "Never synced"

**Possible Causes & Fixes:**

#### A. User not logged in
```javascript
// Check in browser console:
authService.isAuthenticatedSync()  // Should return true
authService.getCurrentUser()       // Should return user object
```

**Fix**: Log in via the "Sign In" button

#### B. Sync not triggered
```javascript
// Manually trigger sync in browser console:
await syncService.syncAll()
```

**Fix**:
- Click the "Sync Now" button in sync status dropdown
- Or reload the page (sync runs on page load for authenticated users)

#### C. API errors blocking sync
```javascript
// Run diagnostic:
// 1. Open browser console on dashboard
// 2. Load sync-diagnostic.js
// 3. Run: await diagnoseSyncIssues()
```

**Fix**: Check console errors for specific API issues

---

### 2. "Sync status shows 'Never synced'"

**Symptoms:**
- Trips exist locally
- User is authenticated
- Sync status never updates

**Possible Causes & Fixes:**

#### A. `lastSyncTime` not being set
```javascript
// Check sync status:
syncService.getSyncStatus()
```

**Fix**: Run manual sync
```javascript
await forceSyncAll()  // Requires sync-fix.js loaded
```

#### B. UI not updating after sync
```javascript
// Check if sync completed:
syncService.lastSyncTime  // Should be a Date object
```

**Fix**: Reload the page

---

### 3. "Trips in cloud but not showing locally"

**Symptoms:**
- Trips visible in Supabase dashboard
- Not appearing in local dashboard

**Possible Causes & Fixes:**

#### A. Conflict resolution skipping trips
The sync system uses "cloud wins if newer" logic. If local version is newer, cloud trips are skipped.

```javascript
// Force pull from cloud:
await forceSyncAll()
```

#### B. localStorage not refreshing
```javascript
// Check localStorage:
const tripManager = new TripManager();
tripManager.getAllTrips()  // Should include cloud trips
```

**Fix**: Hard refresh (Ctrl+Shift+R) or clear localStorage

---

### 4. "Sync indicator not updating"

**Symptoms:**
- Sync runs successfully
- "Synced Xm ago" text doesn't update

**Possible Causes:**

#### A. UI update interval not running
The dashboard updates sync UI every 60 seconds.

**Check**: Look at `dashboard.js` line 23-27:
```javascript
setInterval(() => {
  if (syncService && syncService.getSyncStatus().authenticated) {
    updateSyncUI('synced');
  }
}, 60000);
```

**Fix**: This should run automatically. If not, reload page.

---

## Diagnostic Tools

### 1. Sync Diagnostic Tool

**File**: `sync-diagnostic.js`

**Usage**:
1. Open dashboard in browser
2. Open Developer Console (F12)
3. Copy/paste entire `sync-diagnostic.js` file
4. Run: `await diagnoseSyncIssues()`

**What it checks**:
- ✅ Authentication status
- ✅ localStorage trips
- ✅ Cloud API connectivity
- ✅ Sync service status
- ✅ Local vs cloud comparison

**Output**: Detailed diagnostic report with recommendations

---

### 2. Sync Fix Utility

**File**: `sync-fix.js`

**Usage**:
1. Open dashboard in browser
2. Open Developer Console (F12)
3. Copy/paste entire `sync-fix.js` file
4. Run one of:
   - `await forceSyncAll()` - Force sync all trips
   - `await repairSyncStatus()` - Fix sync markers
   - `await clearSyncAndResync()` - Nuclear option
   - `await testSync()` - Run diagnostic + sync

---

## Manual Sync Process

### Force Sync via Console

```javascript
// 1. Check auth
const user = authService.getCurrentUser();
console.log('Authenticated:', !!user);

// 2. Get local trips
const tripManager = new TripManager();
const localTrips = tripManager.getAllTrips();
console.log('Local trips:', localTrips.length);

// 3. Trigger sync
await syncService.syncAll();

// 4. Check result
const status = syncService.getSyncStatus();
console.log('Last sync:', status.lastSync);

// 5. Reload trips in dashboard
loadTrips();
```

---

## How Sync Works

### Auto-Sync
- **Trigger**: User logs in
- **Frequency**: Every 5 minutes
- **Method**: `syncService.startAutoSync()`

### Manual Sync
- **Trigger**: User clicks "Sync Now" button
- **Method**: `syncService.syncAll()`

### Sync Flow

1. **Push Phase**:
   - Get all local trips
   - For each trip, POST to `/api/trips`
   - Mark as `cloudSynced: true`

2. **Pull Phase**:
   - GET from `/api/trips`
   - Compare with local trips
   - Merge using conflict resolution:
     - New cloud trips → Add to local
     - Existing trips → Cloud wins if newer

3. **Update UI**:
   - Set `lastSyncTime`
   - Notify callbacks
   - Reload dashboard

---

## Conflict Resolution

**Rule**: Cloud wins if `updated_at > local.updatedAt`

**Example**:
```javascript
// Cloud trip updated: 2026-04-11 15:00:00
// Local trip updated: 2026-04-11 14:00:00
// Result: Cloud version replaces local
```

**Override**: Use `await forceSyncAll()` to force push local changes

---

## API Endpoints

### GET `/api/trips`
**Purpose**: Pull all user's trips from cloud
**Auth**: Bearer token required
**Response**: Array of trip objects

### POST `/api/trips`
**Purpose**: Push trip to cloud (upsert)
**Auth**: Bearer token required
**Body**:
```json
{
  "tripId": "trip_123",
  "name": "Trip Name",
  "destination": "Tokyo",
  "startDate": "2026-05-01",
  "endDate": "2026-05-07",
  "coverImage": "https://...",
  "data": { /* full trip object */ },
  "deviceId": "device_abc"
}
```

---

## Database Schema

### `users` table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  supabase_user_id UUID UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `trips` table
```sql
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  cover_image TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `sync_metadata` table
```sql
CREATE TABLE sync_metadata (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  trip_id TEXT,
  device_id TEXT,
  sync_version INTEGER DEFAULT 1,
  synced_at TIMESTAMP DEFAULT NOW()
);
```

---

## Debugging Checklist

When sync isn't working, check in order:

- [ ] **Auth**: Is user logged in? `authService.isAuthenticatedSync()`
- [ ] **Token**: Can we get access token? `await authService.getAccessToken()`
- [ ] **Local trips**: Do trips exist locally? `tripManager.getAllTrips()`
- [ ] **API connectivity**: Can we reach `/api/trips`? Check Network tab
- [ ] **Supabase**: Are tables set up? Run `node check-supabase-setup.js`
- [ ] **RLS policies**: Do policies allow read/write? Check Supabase dashboard
- [ ] **Console errors**: Any errors in browser console?
- [ ] **Network errors**: Check Network tab for failed requests

---

## Quick Fixes

### "I just want it to work"
```javascript
// In browser console:
await forceSyncAll()
location.reload()
```

### "Reset everything"
```javascript
// In browser console:
await clearSyncAndResync()
```

### "Check what's wrong"
```javascript
// In browser console:
await diagnoseSyncIssues()
```

---

## Known Issues

### Issue: `poi_images` table missing
**Impact**: POI images won't cache (minor issue)
**Fix**: Create table using `add-poi-images-table.sql`

### Issue: Sync runs but trips don't appear
**Cause**: Dashboard not reloading after sync
**Fix**: Refresh page or call `loadTrips()` manually

### Issue: "Never synced" even after sync
**Cause**: `lastSyncTime` not persisting
**Fix**: Use `forceSyncAll()` which explicitly sets timestamp

---

## Contact

If none of these solutions work, check:
1. Browser console for errors
2. Network tab for failed API requests
3. Supabase dashboard for RLS policy errors
4. Run `await diagnoseSyncIssues()` and share output

---

**Last Updated**: 2026-04-11
**Version**: 1.1.1
