# 🏨 Booking Integration - Setup Guide

## 🎯 Status: **READY BUT DISABLED**

The booking integration is fully implemented but **feature-flagged OFF** to keep the app non-commercial initially.

---

## 📋 What's Included

### ✅ Implemented Features:
- **Booking sidebar** (iframe-based, no page leave)
- **Multi-provider support**:
  - Booking.com (hotels)
  - Klook (activities, tours, attractions)
  - Viator (tours)
  - TableCheck (restaurants - Japan)
- **Smart activity detection** (auto-categorize: hotel, restaurant, attraction, etc.)
- **Mobile responsive** sidebar
- **Feature flag** control system

### 📂 Files Created:
- `booking-service.js` - Core booking logic
- `booking.css` - Sidebar UI styles
- `feature-flags.js` - Feature control system
- `BOOKING_README.md` - This file

---

## 🚀 How to Enable (When Ready)

### **Step 1: Get Affiliate Accounts**

Apply for affiliate programs:

1. **Booking.com Affiliate Program**
   - URL: https://www.booking.com/affiliate
   - Commission: 25-40% of Booking.com's fee (~4% of booking value)
   - Approval time: 1-3 days

2. **Klook Affiliate Program**
   - URL: https://www.klookaffiliates.com
   - Commission: 5-10%
   - Best for Asia (perfect for Japan focus!)
   - Approval time: 1-7 days

3. **Viator Affiliate Program** (Optional)
   - URL: https://www.viator.com/affiliate
   - Commission: 8-10%
   - Part of TripAdvisor
   - Approval time: 1-3 days

4. **TableCheck** (Optional - Japan-specific)
   - URL: https://www.tablecheck.com
   - Contact for partnership details

---

### **Step 2: Add Affiliate IDs**

Edit `booking-service.js` line ~13:

```javascript
this.affiliateIds = {
  bookingCom: 'YOUR_BOOKING_COM_ID',  // Replace with real ID
  klook: 'YOUR_KLOOK_ID',             // Replace with real ID
  viator: 'YOUR_VIATOR_ID',           // Replace with real ID
  tableCheck: 'YOUR_TABLECHECK_ID'    // Replace with real ID
};
```

---

### **Step 3: Enable the Feature**

#### **Option A: Permanent Enable (Production)**

Edit `feature-flags.js` line ~11:

```javascript
const FEATURES = {
  BOOKING_ENABLED: true,  // Change from false to true
  // ...
};
```

#### **Option B: Test Mode (Browser Console)**

For testing without code changes:

1. Open https://wahgola.zavecoder.com/trip-planner.html
2. Press `F12` (DevTools)
3. Console → Type:
   ```javascript
   enableFeature('BOOKING_ENABLED')
   ```
4. Booking buttons will appear on activity cards!

---

### **Step 4: Deploy**

```bash
git add booking-service.js feature-flags.js
git commit -m "feat: Enable booking integration"
git push origin main
```

Cloudflare Pages will auto-deploy.

---

## 💰 Expected Revenue

### **Conservative Estimates:**

**Per Trip (3-day Fukuoka itinerary):**
- 2 hotel nights @ $100/night → $8-10 commission
- 3 activities @ $30 each → $9 commission
- 1 tour @ $80 → $8 commission

**Total per trip: $25-30**

**Monthly Revenue (if 100 users book):**
- 100 trips × $25 = **$2,500/month**

**Conversion rates:**
- Industry standard: 2-5% of visitors book
- If 1000 monthly users → 20-50 bookings → **$500-1,500/month**

---

## 🎨 User Experience

### **How It Works:**

1. User views trip itinerary
2. Each activity has a "Book Now" button (when enabled)
3. Click → Sidebar slides from right
4. iframe shows booking widget (Klook/Booking.com)
5. User completes booking without leaving Wahgola
6. Close sidebar → Continue planning

### **Visual Flow:**

```
┌─────────────────────────────────────┐
│  Trip Planner                       │
│                                     │
│  Day 1                              │
│  📍 Fukuoka Tower                   │
│  [🎫 Book Tickets] ← Click         │
│                                     │
└─────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────┐
│  [Booking Sidebar Slides In] →     │
│                                     │
│  🎫 Book: Fukuoka Tower            │
│  ┌───────────────────────────────┐ │
│  │  [Klook Widget iframe]        │ │
│  │  - Select date                │ │
│  │  - Choose tickets             │ │
│  │  - Checkout                   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ✓ Booking complete                │
└─────────────────────────────────────┘
```

---

## 🔒 Privacy & Trust

### **User Benefits (Show in UI):**
- ✅ Secure booking (official partner widgets)
- ✅ No price markup (same as booking direct)
- ✅ Instant confirmation
- ✅ 24/7 customer support from providers
- 💡 "You support Wahgola development by booking through us!"

### **Compliance:**
- Add affiliate disclosure footer:
  > "Wahgola may earn a commission from bookings made through our partners. This helps us keep the service free!"

---

## 🧪 Testing Checklist

Before going live:

- [ ] Test Booking.com widget loads in iframe
- [ ] Test Klook widget loads correctly
- [ ] Test sidebar opens/closes smoothly
- [ ] Test mobile responsive design
- [ ] Verify affiliate tracking links work
- [ ] Add analytics to track conversion rates
- [ ] Test with real bookings (small test)
- [ ] Add affiliate disclosure to footer

---

## 📈 Future Enhancements

### **Phase 2 (After Launch):**
- [ ] Price comparison (show multiple providers)
- [ ] "Best Deal" badge on cheapest option
- [ ] Track bookings → Show "X people booked this"
- [ ] Loyalty program (earn points for bookings)
- [ ] Email confirmation integration

### **Phase 3 (Advanced):**
- [ ] Direct API integration (no iframes)
- [ ] Real-time availability checking
- [ ] Bundle deals (hotel + activities)
- [ ] Dynamic pricing (surge pricing awareness)

---

## 🐛 Troubleshooting

### **Booking buttons not showing?**
- Check `feature-flags.js` → `BOOKING_ENABLED: true`
- Check browser console for errors
- Try: `enableFeature('BOOKING_ENABLED')` in console

### **iframe not loading?**
- Check affiliate IDs are correct
- Some providers block localhost (test on production)
- Check browser console for CSP errors

### **Widget shows wrong destination?**
- Check trip context data in `openBooking()` call
- Verify activity has correct metadata

---

## 💡 Tips for Success

1. **Start with Klook** - Best for Asia, easy approval
2. **Test on real trips** - Use your own bookings first
3. **Monitor analytics** - Track which providers convert best
4. **A/B test button placement** - Try different positions
5. **Promote benefits** - Show users why booking through Wahgola is good

---

## 📞 Support

Questions? Check:
- Booking.com Partner Support: https://partner.booking.com/help
- Klook Affiliate Support: affiliates@klook.com
- Code issues: Check `booking-service.js` console logs

---

**Ready to enable?** Just change one line in `feature-flags.js`! 🚀
