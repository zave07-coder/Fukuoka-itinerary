/**
 * Booking Service - Affiliate integration framework
 * Feature flagged - disabled by default
 *
 * Supports: Booking.com, Klook, Viator, TableCheck
 * Integration: iframe widgets + deep links
 */

class BookingService {
  constructor() {
    // Feature flag - controlled by feature-flags.js
    // To enable: Open browser console → enableFeature('BOOKING_ENABLED')
    this.BOOKING_ENABLED = false;

    // Affiliate IDs (placeholder - replace when approved)
    this.affiliateIds = {
      bookingCom: 'YOUR_BOOKING_COM_ID',
      klook: 'YOUR_KLOOK_ID',
      viator: 'YOUR_VIATOR_ID',
      tableCheck: 'YOUR_TABLECHECK_ID'
    };

    // Track opened bookings
    this.activeBooking = null;
  }

  /**
   * Check if booking is enabled
   */
  isEnabled() {
    // Check both local flag and global feature flag
    return this.BOOKING_ENABLED && (typeof isFeatureEnabled === 'function' ? isFeatureEnabled('BOOKING_ENABLED') : false);
  }

  /**
   * Open booking sidebar for an activity
   */
  openBooking(activity, tripContext) {
    if (!this.isEnabled()) {
      console.log('[Booking] Feature disabled');
      return;
    }

    this.activeBooking = { activity, tripContext };

    // Determine booking provider based on activity type
    const provider = this.getProviderForActivity(activity);

    // Show sidebar with appropriate widget
    this.showBookingSidebar(activity, provider, tripContext);
  }

  /**
   * Determine best booking provider for activity
   */
  getProviderForActivity(activity) {
    const type = activity.bookingType || this.detectActivityType(activity);

    switch(type) {
      case 'hotel':
      case 'accommodation':
        return 'bookingCom';

      case 'attraction':
      case 'tour':
      case 'activity':
        return 'klook'; // Best for Asia

      case 'restaurant':
        return 'tableCheck'; // Japan-specific

      case 'transport':
        return 'klook'; // Also handles transport

      default:
        return 'klook'; // Default fallback
    }
  }

  /**
   * Detect activity type from name/category
   */
  detectActivityType(activity) {
    const name = (activity.name || '').toLowerCase();
    const category = (activity.category || '').toLowerCase();

    if (name.includes('hotel') || name.includes('stay') || category.includes('accommodation')) {
      return 'hotel';
    }

    if (name.includes('restaurant') || name.includes('cafe') || category.includes('dining')) {
      return 'restaurant';
    }

    if (name.includes('tower') || name.includes('museum') || name.includes('park')) {
      return 'attraction';
    }

    if (name.includes('tour') || name.includes('cruise')) {
      return 'tour';
    }

    return 'activity'; // Default
  }

  /**
   * Show booking sidebar with widget
   */
  showBookingSidebar(activity, provider, tripContext) {
    const sidebar = document.getElementById('booking-sidebar');
    const title = document.getElementById('booking-title');
    const content = document.getElementById('booking-content');

    if (!sidebar || !title || !content) {
      console.error('[Booking] Sidebar elements not found');
      return;
    }

    // Update title
    title.textContent = `Book: ${activity.name}`;

    // Generate widget based on provider
    const widget = this.generateWidget(provider, activity, tripContext);
    content.innerHTML = widget;

    // Show sidebar
    sidebar.classList.add('active');
    document.body.classList.add('booking-active');
  }

  /**
   * Close booking sidebar
   */
  closeBooking() {
    const sidebar = document.getElementById('booking-sidebar');
    sidebar?.classList.remove('active');
    document.body.classList.remove('booking-active');
    this.activeBooking = null;
  }

  /**
   * Generate booking widget HTML
   */
  generateWidget(provider, activity, tripContext) {
    switch(provider) {
      case 'bookingCom':
        return this.generateBookingComWidget(activity, tripContext);

      case 'klook':
        return this.generateKlookWidget(activity, tripContext);

      case 'viator':
        return this.generateViatorWidget(activity, tripContext);

      case 'tableCheck':
        return this.generateTableCheckWidget(activity, tripContext);

      default:
        return this.generateGenericWidget(activity, tripContext);
    }
  }

  /**
   * Booking.com hotel widget
   */
  generateBookingComWidget(activity, tripContext) {
    const destination = tripContext.destination || 'Fukuoka';
    const checkIn = tripContext.startDate || '';
    const checkOut = tripContext.endDate || '';

    const params = new URLSearchParams({
      aid: this.affiliateIds.bookingCom,
      ss: destination,
      checkin: checkIn,
      checkout: checkOut,
      dest_type: 'city',
      group_adults: 2,
      no_rooms: 1
    });

    const url = `https://www.booking.com/searchresults.html?${params.toString()}`;

    return `
      <div class="booking-widget">
        <div class="booking-info">
          <p>🏨 Find hotels in ${destination}</p>
          <p class="booking-subtext">Secure booking through Booking.com</p>
        </div>
        <iframe
          src="${url}"
          frameborder="0"
          scrolling="yes"
          class="booking-iframe"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        ></iframe>
      </div>
    `;
  }

  /**
   * Klook activity widget
   */
  generateKlookWidget(activity, tripContext) {
    const destination = tripContext.destination || 'Fukuoka';
    const activityName = activity.name;

    // Klook deep link format
    const searchQuery = encodeURIComponent(`${activityName} ${destination}`);
    const url = `https://www.klook.com/search/?query=${searchQuery}&affiliate_id=${this.affiliateIds.klook}`;

    return `
      <div class="booking-widget">
        <div class="booking-info">
          <p>🎫 Book tickets for ${activityName}</p>
          <p class="booking-subtext">Instant confirmation • Mobile ticket</p>
        </div>
        <iframe
          src="${url}"
          frameborder="0"
          scrolling="yes"
          class="booking-iframe"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        ></iframe>
      </div>
    `;
  }

  /**
   * Viator tour widget
   */
  generateViatorWidget(activity, tripContext) {
    const destination = tripContext.destination || 'Fukuoka';
    const activityName = activity.name;

    const searchQuery = encodeURIComponent(`${activityName} ${destination}`);
    const url = `https://www.viator.com/searchResults/all?text=${searchQuery}&pid=${this.affiliateIds.viator}`;

    return `
      <div class="booking-widget">
        <div class="booking-info">
          <p>🗺️ Book tours & experiences</p>
          <p class="booking-subtext">Free cancellation • Best price guarantee</p>
        </div>
        <iframe
          src="${url}"
          frameborder="0"
          scrolling="yes"
          class="booking-iframe"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        ></iframe>
      </div>
    `;
  }

  /**
   * TableCheck restaurant widget (Japan-specific)
   */
  generateTableCheckWidget(activity, tripContext) {
    const restaurantName = activity.name;
    const date = tripContext.currentDate || '';

    return `
      <div class="booking-widget">
        <div class="booking-info">
          <p>🍽️ Reserve table at ${restaurantName}</p>
          <p class="booking-subtext">Instant confirmation • No booking fee</p>
        </div>
        <div class="booking-fallback">
          <p>Restaurant reservations coming soon!</p>
          <p class="booking-subtext">For now, please call the restaurant directly:</p>
          <p><strong>${activity.location?.phone || 'See details on map'}</strong></p>
        </div>
      </div>
    `;
  }

  /**
   * Generic fallback widget
   */
  generateGenericWidget(activity, tripContext) {
    return `
      <div class="booking-widget">
        <div class="booking-info">
          <p>🔍 Search for "${activity.name}"</p>
        </div>
        <div class="booking-fallback">
          <p>Direct booking coming soon!</p>
          <p class="booking-subtext">For now, use the search links below:</p>
          <div class="booking-links">
            <a href="https://www.google.com/search?q=${encodeURIComponent(activity.name + ' ' + tripContext.destination)}" target="_blank" class="booking-link">
              Google Search
            </a>
            <a href="https://www.tripadvisor.com/Search?q=${encodeURIComponent(activity.name)}" target="_blank" class="booking-link">
              TripAdvisor
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Add booking button to activity card
   */
  getBookingButton(activity, tripContext) {
    if (!this.isEnabled()) {
      return ''; // Return empty if disabled
    }

    const type = this.detectActivityType(activity);
    const icon = this.getIconForType(type);
    const label = this.getLabelForType(type);

    return `
      <button class="activity-book-btn" onclick="bookingService.openBooking(${JSON.stringify(activity)}, ${JSON.stringify(tripContext)})">
        ${icon} ${label}
      </button>
    `;
  }

  /**
   * Get icon for activity type
   */
  getIconForType(type) {
    const icons = {
      hotel: '🏨',
      restaurant: '🍽️',
      attraction: '🎫',
      tour: '🗺️',
      transport: '🚆',
      activity: '🎯'
    };
    return icons[type] || '📌';
  }

  /**
   * Get button label for type
   */
  getLabelForType(type) {
    const labels = {
      hotel: 'Book Hotel',
      restaurant: 'Reserve Table',
      attraction: 'Buy Tickets',
      tour: 'Book Tour',
      transport: 'Book Transport',
      activity: 'Book Now'
    };
    return labels[type] || 'Book';
  }

  /**
   * Track booking analytics (for future)
   */
  trackBookingClick(activity, provider) {
    console.log('[Booking Analytics]', {
      activity: activity.name,
      provider: provider,
      timestamp: new Date().toISOString()
    });

    // TODO: Send to analytics service when enabled
  }
}

// Global instance
const bookingService = new BookingService();

// Expose close function globally for onclick
function closeBooking() {
  bookingService.closeBooking();
}
