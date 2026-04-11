# Version Tracking System

## Overview
Wahgola now includes a version tracking system to help identify which version is currently deployed and detect cache issues.

## How It Works

### 1. Version Indicator
All pages (dashboard, trip-planner, login) now display a version indicator in the bottom-right corner:
- Shows version number and build timestamp (in SGT)
- Click to refresh and check for updates
- Tooltip shows detailed environment status

### 2. Version API Endpoint
`GET /api/version` returns current version info:

```json
{
  "version": "1.1.0",
  "buildDate": "2026-04-11",
  "buildTime": "14:30",
  "buildTimestamp": "2026-04-11T14:30:00+08:00",
  "versionString": "v1.1.0 (2026-04-11 14:30 SGT)",
  "timestamp": "2026-04-11T06:30:00.000Z",
  "env": {
    "hasSupabaseUrl": true,
    "hasSupabaseServiceKey": true,
    "hasSupabaseAnonKey": true,
    "hasOpenAI": true
  }
}
```

### 3. Cache Busting
- Version endpoint uses `no-cache` headers
- Client always appends `?timestamp` to prevent caching
- Each page check shows real-time version

## Updating Version

When deploying a new version:

1. **Update `_worker.js`** (lines 2091-2096):
   ```javascript
   const buildDate = '2026-04-11';  // Update date
   const buildTime = '14:30';       // Update time (SGT)
   const buildTimestamp = '2026-04-11T14:30:00+08:00';

   const version = {
     version: '1.1.0',  // Update version number
     // ...
   };
   ```

2. **Update `version.js`** (optional standalone file):
   ```javascript
   export const VERSION = {
     number: '1.1.0',
     buildDate: '2026-04-11',
     buildTime: '14:30',
     buildTimestamp: '2026-04-11T14:30:00+08:00',
   };
   ```

3. Deploy to Cloudflare Pages

## Troubleshooting Cache Issues

If users see an old version:

1. **Check version indicator** - Click to refresh
2. **Hard refresh** - Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
3. **Clear browser cache** - Developer Tools > Application > Clear Storage
4. **Check API response** - Open DevTools Console to see `📦 Version:` log

## Version Numbering

We use Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR** (1.x.x) - Breaking changes or major rewrites
- **MINOR** (x.1.x) - New features, non-breaking changes
- **PATCH** (x.x.1) - Bug fixes, minor tweaks

### Recent Versions

- **v1.1.0** (2026-04-11 14:30 SGT) - Added version tracking system
- **v1.0.1** (Previous) - GPT-4o model restoration
- **v1.0.0** (Previous) - Initial release

## Files Involved

- `_worker.js` - Version endpoint handler (lines 2088-2106)
- `version.js` - Standalone version constants (optional)
- `dashboard.html` - Version indicator UI
- `trip-planner.html` - Version indicator UI
- `login.html` - Version indicator UI
- `VERSION_TRACKING.md` - This documentation

## Benefits

1. **Instant visibility** - Users can see current version at a glance
2. **Cache detection** - Different versions indicate cache issues
3. **Environment status** - Quick check if APIs are configured
4. **Timestamp tracking** - SGT timezone for local deployment tracking
5. **Debugging** - Console logs show full version info
