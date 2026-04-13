# 🔗 Trip Sharing Feature

## Overview

The trip sharing feature allows users to generate shareable links for their trips, enabling guest viewers to preview trips and sign up to clone them to their own account.

---

## Features

### ✅ For Logged-In Users

1. **Generate Share Link**
   - Click the share button in trip planner header
   - Generates unique, permanent share token
   - Copy shareable link to clipboard
   - Track view counts (future feature)

2. **Share Management**
   - Each trip can have multiple share links
   - Links never expire (configurable in future)
   - Can regenerate new links anytime

### 👀 For Guest Viewers

1. **Read-Only Trip View**
   - Beautiful, simplified trip layout
   - All activities and details visible
   - No edit controls shown
   - Watermarked with Wahgola branding

2. **Conversion CTAs**
   - Persistent top banner with signup prompt
   - "Clone This Trip" button
   - "Sign Up Free" button
   - Bottom watermark with branding

3. **Clone After Signup**
   - Guest clicks "Clone This Trip"
   - Redirected to signup page
   - After signup, trip automatically cloned
   - Redirected to their cloned trip

---

## Technical Implementation

### Database Schema

**Table: `trip_shares`**

```sql
CREATE TABLE trip_shares (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = no expiry
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

**Indexes:**
- `idx_trip_shares_token` on `share_token`
- `idx_trip_shares_trip_id` on `trip_id`
- `idx_trip_shares_created_by` on `created_by`

**RLS Policies:**
- Users can create shares for own trips
- Users can view own shares
- Public can read active shares by token (for guest viewing)
- Users can update/delete own shares

### API Endpoints

#### 1. Generate Share Link
**POST** `/api/generate-share-link`

**Auth:** Required (Bearer token)

**Request:**
```json
{
  "tripId": "uuid"
}
```

**Response:**
```json
{
  "shareToken": "unique-token",
  "shareUrl": "https://wahgola.com/shared/unique-token"
}
```

#### 2. Get Shared Trip (Public)
**GET** `/api/shared-trip?token=<shareToken>`

**Auth:** None (public endpoint)

**Response:**
```json
{
  "trip": {
    "id": "uuid",
    "destination": "Tokyo",
    "days": [...],
    "metadata": {...}
  },
  "viewCount": 42,
  "isShared": true
}
```

#### 3. Clone Shared Trip
**POST** `/api/clone-shared-trip`

**Auth:** Required (Bearer token)

**Request:**
```json
{
  "shareToken": "unique-token"
}
```

**Response:**
```json
{
  "success": true,
  "tripId": "new-trip-uuid",
  "message": "Trip cloned successfully!"
}
```

### URL Routes

#### Share Link Format
```
https://wahgola.com/shared/<share-token>
```

**Example:**
```
https://wahgola.com/shared/a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8
```

**Implementation:**
- Worker rewrites `/shared/:token` to `/shared.html?token=:token`
- JavaScript on shared.html fetches trip data via API
- No caching for HTML (always fresh)

---

## User Flows

### Flow 1: Share a Trip

```
User in Trip Planner
  ↓
Click Share Button
  ↓
Modal opens with loading state
  ↓
API generates share token
  ↓
Modal shows share link + copy button
  ↓
User copies link
  ↓
User shares via email/social/messaging
```

### Flow 2: Guest Views Shared Trip

```
Guest clicks shared link
  ↓
Lands on /shared/:token
  ↓
Page loads trip data via API
  ↓
Shows read-only trip view
  ↓
Top banner: "Sign up to clone this trip"
  ↓
Guest browses itinerary
```

### Flow 3: Guest Clones Trip (Requires Signup)

```
Guest on shared trip page
  ↓
Clicks "Clone This Trip" button
  ↓
Clone intent saved to sessionStorage
  ↓
Redirected to /login.html
  ↓
Guest signs up / logs in
  ↓
After auth, checks for clone intent
  ↓
Auto-triggers clone API
  ↓
Redirected to their cloned trip
  ↓
Success! Guest now has their own copy
```

### Flow 4: Logged-In User Clones Trip

```
Logged-in user clicks shared link
  ↓
Views shared trip page
  ↓
Clicks "Clone This Trip"
  ↓
Immediately triggers clone API
  ↓
Shows success message
  ↓
Redirected to cloned trip
```

---

## UI Components

### Share Modal (trip-planner.html)

**States:**
1. **Loading** - Spinner while generating link
2. **Success** - Share link + copy button + info
3. **Error** - Error message + retry button

**Features:**
- Copy to clipboard with confirmation
- Share info explaining what guests can do
- Future: View count display
- Future: Regenerate link option

### Guest Banner (shared.html)

**Components:**
- Icon + title + subtitle
- "Clone This Trip" button
- "Sign Up Free" button

**Styling:**
- Sticky at top (z-index: 1000)
- Gradient background (purple theme)
- Responsive layout

### Guest Watermark

**Position:** Fixed bottom-right
**Content:** "✨ Made with **Wahgola** - AI Trip Planner"
**Purpose:** Branding + conversion

---

## Security Considerations

### ✅ Implemented

1. **Token-based sharing** - UUIDs, not sequential IDs
2. **RLS policies** - Database-level access control
3. **Auth verification** - Clone requires valid JWT
4. **Ownership checks** - Only trip owners can share
5. **Public read-only** - Guests can't modify original

### 🔒 Future Enhancements

1. **Expiring links** - Set `expires_at` timestamp
2. **Deactivate shares** - Toggle `is_active` flag
3. **Password protection** - Optional share passwords
4. **Analytics** - Track views, clones, conversions
5. **Rate limiting** - Prevent spam cloning

---

## Performance

### Caching Strategy

**HTML (shared.html):**
```
Cache-Control: no-cache, no-store, must-revalidate
```

**API (shared-trip):**
```
Cache-Control: public, max-age=300
```
(5-minute cache for trip data)

**Images:**
- Same optimization as main app
- WebP format, lazy loading
- Responsive srcset

### Database Queries

**Optimized with indexes:**
- Share token lookup: O(1) with unique index
- Trip data fetch: O(1) with primary key
- View count increment: Single UPDATE query

---

## Migration Steps

### 1. Run Database Migration

```sql
-- Run migrations/002_trip_shares.sql in Supabase SQL Editor
```

### 2. Deploy Code

```bash
# Deploy to Cloudflare Pages
git push origin main
```

### 3. Verify Deployment

- Test share link generation
- Test guest viewing
- Test clone flow
- Test signup with clone intent

---

## Future Improvements

### Phase 2 Features

1. **Analytics Dashboard**
   - Total shares created
   - View counts per trip
   - Clone conversion rate
   - Most shared trips

2. **Social Sharing**
   - Twitter card integration
   - Facebook Open Graph tags
   - WhatsApp preview images
   - Email templates

3. **Enhanced Sharing**
   - Expiring links (24h, 7d, 30d)
   - Password-protected shares
   - Custom share messages
   - Share with specific users

4. **Collaboration**
   - Shared editing (multiplayer)
   - Comment threads on activities
   - Voting on activities
   - Split costs among travelers

### Phase 3 Features

1. **Viral Growth**
   - Referral rewards
   - "X people cloned this trip" badges
   - Featured shared trips gallery
   - Trip templates marketplace

2. **Monetization**
   - Premium shares (analytics, branding)
   - Affiliate links in shared trips
   - Sponsored trip suggestions
   - White-label sharing for agencies

---

## Testing Checklist

### ✅ Share Generation
- [ ] Generate share link for trip
- [ ] Copy link to clipboard
- [ ] Verify link format
- [ ] Check database record created

### ✅ Guest Viewing
- [ ] Access shared link as guest
- [ ] Verify read-only view
- [ ] Check banner displays correctly
- [ ] Verify watermark visible
- [ ] Confirm edit controls hidden

### ✅ Clone Flow (Guest)
- [ ] Click "Clone This Trip" as guest
- [ ] Verify redirect to signup
- [ ] Complete signup
- [ ] Confirm auto-clone triggers
- [ ] Check redirect to cloned trip
- [ ] Verify trip is editable

### ✅ Clone Flow (Logged In)
- [ ] Access shared link while logged in
- [ ] Click "Clone This Trip"
- [ ] Verify immediate clone
- [ ] Check success message
- [ ] Confirm redirect to cloned trip

### ✅ Error Handling
- [ ] Invalid share token
- [ ] Expired/inactive share
- [ ] Clone without auth
- [ ] Network errors
- [ ] Database errors

---

## Support & Troubleshooting

### Common Issues

**Issue:** "Invalid or expired share link"
**Solution:** Share may have been deactivated or deleted. Contact trip owner for new link.

**Issue:** Clone button doesn't work
**Solution:** Clear browser cache, ensure JavaScript enabled, check auth state.

**Issue:** Share link not generating
**Solution:** Verify authentication, check trip ownership, review API logs.

---

## Metrics to Track

1. **Adoption Metrics**
   - % of users who create shares
   - Avg shares per user
   - Avg shares per trip

2. **Engagement Metrics**
   - Views per shared link
   - Avg time on shared page
   - Bounce rate

3. **Conversion Metrics**
   - Guest → Signup conversion rate
   - Share → Clone conversion rate
   - Clone → Active user rate

4. **Viral Metrics**
   - Viral coefficient (shares per user)
   - Referral signup attribution
   - Organic vs shared traffic

---

## Conclusion

The trip sharing feature is a **growth engine** for Wahgola:

1. **User Acquisition** - Guests convert to signups
2. **Engagement** - Users share their trips
3. **Retention** - Cloned trips keep users active
4. **Virality** - Each share is a marketing channel

**Next Step:** Run migration → Deploy → Test → Monitor analytics!
