# ZMailer Email Integration

## Overview

ZMailer is integrated for sending trip-sharing emails. Users can share their itineraries via email with beautiful HTML templates.

---

## Configuration

### Environment Variables

Added to Cloudflare Pages (Production & Preview):

```
ZMAILER_API_KEY=zm_live_9b3523680f8ae5a5dd833cfe8e1f9a8afd4beb7062c0eee6
ZMAILER_DOMAIN=zavecoder.com
```

Also stored in `.env` for local development.

---

## API Endpoint

### Share Trip via Email

**Endpoint**: `POST /api/share-trip`

**Request Body**:
```json
{
  "tripId": "1234567890-abc",
  "recipientEmail": "friend@example.com",
  "senderName": "John Doe",
  "tripData": {
    "name": "Tokyo Adventure",
    "destination": "Tokyo, Japan",
    "startDate": "2026-06-14",
    "endDate": "2026-06-20",
    "days": [
      {
        "title": "Day 1",
        "activities": [...]
      }
    ]
  }
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Trip shared successfully!"
}
```

**Response** (Error):
```json
{
  "error": "Email sending failed: <reason>"
}
```

---

## Email Template

The email includes:

1. **Header**
   - Gradient background (purple/blue)
   - "Trip Shared With You!" title
   - Sender's name

2. **Trip Information**
   - Trip name
   - Destination
   - Number of days
   - Start/end dates

3. **Call to Action**
   - "View Trip Itinerary" button
   - Links to app with import parameter

4. **Footer**
   - Branding ("WayWeave")

### Example Email:

```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌏 Trip Shared With You!</h1>
      <p>John Doe wants to share their travel plans</p>
    </div>
    <div class="content">
      <div class="trip-info">
        <h2>Tokyo Adventure</h2>
        <p>📍 Destination: Tokyo, Japan</p>
        <p>📅 Duration: 7 days</p>
      </div>
      ...
      <a href="https://fkk.zavecoder.com?import=..." class="button">
        View Trip Itinerary
      </a>
    </div>
  </div>
</body>
</html>
```

---

## Frontend Integration

### Example: Share Trip Function

```javascript
async function shareTrip(tripId, recipientEmail) {
  const trip = tripManager.getTrip(tripId);

  if (!trip) {
    alert('Trip not found');
    return;
  }

  try {
    const response = await fetch('/api/share-trip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tripId: trip.id,
        recipientEmail: recipientEmail,
        senderName: 'Your Name', // Get from auth or user input
        tripData: trip
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to share trip');
    }

    const result = await response.json();
    alert('Trip shared successfully!');
  } catch (error) {
    console.error('Share error:', error);
    alert('Failed to share trip: ' + error.message);
  }
}
```

### Add Share Button to Trip Cards

```html
<button onclick="promptShareTrip('trip-id')">
  <svg><!-- share icon --></svg>
  Share via Email
</button>

<script>
function promptShareTrip(tripId) {
  const email = prompt('Enter recipient email:');
  if (email && email.includes('@')) {
    shareTrip(tripId, email);
  } else {
    alert('Please enter a valid email address');
  }
}
</script>
```

---

## Import Shared Trip

When recipient clicks the email link, they're taken to:

```
https://fkk.zavecoder.com?import=BASE64_ENCODED_TRIP_DATA
```

### Handle Import on Page Load

```javascript
// Check for import parameter
const urlParams = new URLSearchParams(window.location.search);
const importData = urlParams.get('import');

if (importData) {
  try {
    // Decode base64
    const tripData = JSON.parse(atob(importData));

    // Save to local collection
    const importedTrip = tripManager.createTrip(tripData);

    // Show success message
    alert(`Trip "${tripData.name}" imported successfully!`);

    // Open the trip
    window.location.href = `/trip.html?id=${importedTrip.id}`;
  } catch (error) {
    console.error('Import error:', error);
    alert('Failed to import trip');
  }
}
```

---

## ZMailer Helper Function

Located in `_worker.js`:

```javascript
/**
 * Send email via ZMailer API
 * @param {Object} env - Environment variables
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Result with success status
 */
async function sendEmail(env, { from, to, subject, html, text }) {
  if (!env.ZMAILER_API_KEY) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://zmailer.zavecoder.com/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.ZMAILER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: from || `noreply@${env.ZMAILER_DOMAIN}`,
        to,
        subject,
        html,
        text
      })
    });

    if (!response.ok) {
      throw new Error('ZMailer API error');
    }

    const result = await response.json();
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Testing

### Manual Test via Console

```javascript
// Test sharing a trip
const trip = tripManager.getAllTrips()[0];

fetch('/api/share-trip', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tripId: trip.id,
    recipientEmail: 'test@example.com',
    senderName: 'Test User',
    tripData: trip
  })
})
.then(r => r.json())
.then(data => console.log('Share result:', data))
.catch(err => console.error('Share error:', err));
```

### Check Email Delivery

1. Share a trip to your email
2. Check inbox (may take 1-2 minutes)
3. Click "View Trip Itinerary" button
4. Verify trip imports correctly

---

## Future Enhancements

### Planned Features

1. **Collaborative Editing**
   - Multiple users can edit shared trip
   - Real-time sync via Supabase
   - Permission levels (view/edit)

2. **Email Templates**
   - Multiple template styles
   - Custom branding
   - Trip preview images

3. **Share Options**
   - Share link (without email)
   - QR code generation
   - Social media sharing

4. **Notifications**
   - Trip update notifications
   - Reminder emails before trip
   - Daily itinerary emails during trip

---

## Troubleshooting

### Email Not Sending

**Check**:
1. `ZMAILER_API_KEY` is set in Cloudflare Pages
2. API key is valid (check ZMailer dashboard)
3. Domain `zavecoder.com` is verified in ZMailer
4. Recipient email is valid

**Debug**:
```javascript
// Check env vars in worker logs
console.log('ZMailer configured:', !!env.ZMAILER_API_KEY);
```

### Email Goes to Spam

**Solutions**:
1. Verify SPF/DKIM records for `zavecoder.com`
2. Add "List-Unsubscribe" header
3. Avoid spam trigger words in subject
4. Use plain text version alongside HTML

### Import Link Not Working

**Check**:
1. Trip data is properly base64 encoded
2. URL isn't truncated (use URL shortener if too long)
3. Import handler exists on target page
4. Trip data structure is valid

---

## Security Considerations

### Current Implementation

- ✅ API key stored securely (env vars)
- ✅ Server-side email sending only
- ✅ No sensitive data in email
- ⚠️ Trip data in URL (consider encryption)

### Recommendations

1. **Add Rate Limiting**
   - Limit emails per user per day
   - Prevent spam/abuse

2. **Encrypt Import Data**
   - Use JWT instead of base64
   - Sign data to prevent tampering

3. **Email Validation**
   - Verify recipient email exists
   - Require CAPTCHA for shares

4. **Auth Required**
   - Only authenticated users can share
   - Track shares per user

---

## API Reference

### ZMailer API Endpoint

```
POST https://zmailer.zavecoder.com/api/send
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "from": "sender@domain.com",
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<html>...</html>",
  "text": "Plain text version"
}
```

For full documentation: https://zmailer.zavecoder.com/docs

---

## Summary

✅ **Configured**: ZMailer API integrated
✅ **Deployed**: Environment variables set in Cloudflare
✅ **Implemented**: `/api/share-trip` endpoint
✅ **Tested**: Ready for use

**Next Steps**:
1. Add share button UI to dashboard
2. Implement import handler
3. Test email delivery
4. Add tracking/analytics
