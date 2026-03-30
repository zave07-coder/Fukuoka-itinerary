/**
 * Trip Planner V2 - Dynamic trip viewer with data integration
 * Loads trip from localStorage and enables editing/saving
 */

// Initialize trip manager
const tripManager = new TripManager();

// Current trip state
let currentTrip = null;
let currentTripId = null;
let map = null;
let markers = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTripFromURL();
  initializeMap();
});

/**
 * Load trip from URL parameter
 */
function loadTripFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  currentTripId = urlParams.get('trip');

  if (!currentTripId) {
    alert('No trip ID provided');
    window.location.href = 'dashboard-v2.html';
    return;
  }

  currentTrip = tripManager.getTrip(currentTripId);

  if (!currentTrip) {
    alert('Trip not found');
    window.location.href = 'dashboard-v2.html';
    return;
  }

  renderTrip();
}

/**
 * Render trip data to the page
 */
function renderTrip() {
  if (!currentTrip) return;

  // Update header
  document.querySelector('.trip-title').textContent = currentTrip.name || 'Untitled Trip';
  document.querySelector('.trip-meta').textContent = formatTripMeta(currentTrip);
  document.title = `${currentTrip.name} | WayWeave`;

  // Render days
  const itineraryPanel = document.querySelector('.itinerary-panel');
  itineraryPanel.innerHTML = renderDays(currentTrip.days || []);

  // Update map
  if (currentTrip.days && currentTrip.days.length > 0) {
    updateMapMarkers();
  }
}

/**
 * Render all days
 */
function renderDays(days) {
  if (!days || days.length === 0) {
    return `
      <div class="empty-itinerary">
        <div class="empty-icon">📅</div>
        <h2>No itinerary yet</h2>
        <p>Click "AI Edit" to generate your itinerary</p>
        <button class="btn-primary btn-large" onclick="openAIEditModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
          <span>Generate Itinerary with AI</span>
        </button>
      </div>
    `;
  }

  return days.map((day, index) => renderDayCard(day, index + 1)).join('');
}

/**
 * Render a single day card
 */
function renderDayCard(day, dayNumber) {
  const activities = day.activities || [];
  const date = calculateDayDate(currentTrip.startDate, dayNumber - 1);

  return `
    <section class="day-card">
      <div class="day-card-header">
        <div class="day-number-badge">Day ${dayNumber}</div>
        <div class="day-info">
          <h2 class="day-title">${escapeHtml(day.title || `Day ${dayNumber}`)}</h2>
          <p class="day-date">${formatDate(date)}</p>
        </div>
        <div class="day-actions">
          <button class="btn-ai-day" onclick="editDayWithAI(${dayNumber})" title="Edit Day ${dayNumber} with AI">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span>AI Edit Day</span>
          </button>
          <button class="day-action-btn" onclick="editDay(${dayNumber})" title="Manual edit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="activities-list">
        ${activities.map((activity, idx) => renderActivity(activity, idx, dayNumber)).join('')}
      </div>
    </section>
  `;
}

/**
 * Render a single activity
 */
function renderActivity(activity, activityIndex, dayNumber) {
  const hasImage = activity.image || (activity.location && activity.location.type);
  const imageUrl = activity.image || getDefaultActivityImage(activity.location?.type);

  const imageHtml = hasImage ? `
    <div class="activity-image-wrapper">
      <img src="${imageUrl}" alt="${escapeHtml(activity.name)}" class="activity-image">
    </div>
  ` : '';

  return `
    <div class="activity-item ${hasImage ? 'activity-with-image' : ''}" data-day="${dayNumber}" data-activity="${activityIndex}">
      <div class="activity-time">
        <span class="time-badge">${escapeHtml(activity.time || '')}</span>
      </div>
      <div class="activity-content">
        ${imageHtml}

        <div class="activity-header">
          <h3 class="activity-name">${escapeHtml(activity.name)}</h3>
          ${getActivityTypeBadge(activity.location?.type)}
        </div>
        <p class="activity-description">
          ${escapeHtml(activity.details || activity.description || '')}
        </p>
        ${renderActivityMeta(activity)}
        ${renderActivityActions(activity, dayNumber, activityIndex)}
      </div>
    </div>
  `;
}

/**
 * Render activity metadata
 */
function renderActivityMeta(activity) {
  const items = [];

  if (activity.location && activity.location.address) {
    items.push(`
      <div class="meta-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${escapeHtml(activity.location.address)}</span>
      </div>
    `);
  }

  if (activity.duration) {
    items.push(`
      <div class="meta-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>${escapeHtml(activity.duration)}</span>
      </div>
    `);
  }

  return items.length > 0 ? `<div class="activity-meta">${items.join('')}</div>` : '';
}

/**
 * Render activity action buttons
 */
function renderActivityActions(activity, dayNumber, activityIndex) {
  const actions = [];

  if (activity.location && activity.location.lat && activity.location.lng) {
    actions.push(`
      <button class="activity-action-btn" onclick="focusOnMap(${activity.location.lat}, ${activity.location.lng}, '${escapeHtml(activity.name)}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        Show on Map
      </button>
    `);
  }

  if (activity.link || activity.url) {
    actions.push(`
      <button class="activity-action-btn" onclick="window.open('${activity.link || activity.url}', '_blank')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        Open Link
      </button>
    `);
  }

  return actions.length > 0 ? `<div class="activity-actions">${actions.join('')}</div>` : '';
}

/**
 * Initialize Mapbox map
 */
function initializeMap() {
  if (typeof mapboxgl === 'undefined') {
    console.error('Mapbox GL JS not loaded');
    showMapError('Mapbox GL JS library not loaded');
    return;
  }

  console.log('Initializing map...');

  // Check if config is already loaded (from config.js script tag)
  if (!window.MAPBOX_CONFIG || !window.MAPBOX_CONFIG.token) {
    console.error('Mapbox config not found');
    showMapError('Mapbox configuration missing');
    return;
  }

  try {
    mapboxgl.accessToken = window.MAPBOX_CONFIG.token;
    console.log('Mapbox token set, creating map...');

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [135.7681, 35.0116], // Default to Kyoto
      zoom: 11
    });

    map.on('load', () => {
      console.log('Map loaded successfully ✅');
      updateMapMarkers();
    });

    map.on('error', (e) => {
      console.error('Map error:', e);
      showMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
    });

    map.addControl(new mapboxgl.NavigationControl());
  } catch (err) {
    console.error('Map initialization error:', err);
    showMapError(err.message);
  }
}

/**
 * Show error message in map container
 */
function showMapError(errorMessage) {
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; gap: 16px; padding: 24px; text-align: center; background: #f8f9fa;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <div>
          <strong style="color: #475569; display: block; margin-bottom: 8px;">Map unavailable</strong>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">${errorMessage}</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">Check browser console for details</p>
        </div>
      </div>
    `;
  }
}

/**
 * Update map markers from trip data
 */
function updateMapMarkers() {
  if (!map || !currentTrip || !currentTrip.days) return;

  // Clear existing markers
  markers.forEach(marker => marker.remove());
  markers = [];

  const locations = [];

  // Collect all locations
  currentTrip.days.forEach((day, dayIndex) => {
    if (!day.activities) return;

    day.activities.forEach(activity => {
      if (activity.location && activity.location.lat && activity.location.lng) {
        locations.push({
          ...activity.location,
          activityName: activity.name,
          dayNumber: dayIndex + 1
        });
      }
    });
  });

  // Add markers
  locations.forEach(loc => {
    const el = document.createElement('div');
    el.className = 'map-marker';
    el.innerHTML = getMarkerIcon(loc.type);
    el.style.cssText = `
      width: 32px;
      height: 32px;
      background: var(--color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;

    const marker = new mapboxgl.Marker(el)
      .setLngLat([loc.lng, loc.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<strong>${loc.activityName}</strong><br>${loc.address || ''}`))
      .addTo(map);

    markers.push(marker);
  });

  // Fit bounds if locations exist
  if (locations.length > 0) {
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(loc => bounds.extend([loc.lng, loc.lat]));
    map.fitBounds(bounds, { padding: 50 });
  }
}

/**
 * Focus map on specific location
 */
function focusOnMap(lat, lng, name) {
  if (!map) return;

  map.flyTo({
    center: [lng, lat],
    zoom: 15,
    duration: 1500
  });

  // Find and open popup
  const marker = markers.find(m => {
    const lngLat = m.getLngLat();
    return lngLat.lat === lat && lngLat.lng === lng;
  });

  if (marker) {
    marker.togglePopup();
  }
}

/**
 * Modal functions
 */
function openAIEditModal() {
  document.getElementById('aiEditModal').style.display = 'flex';
  document.getElementById('aiEditPrompt').focus();
}

function closeAIEditModal() {
  document.getElementById('aiEditModal').style.display = 'none';
}

function editDay(dayNum) {
  alert('Manual editing coming soon! Use AI Edit for now.');
}

function editDayWithAI(dayNum) {
  document.getElementById('aiEditPrompt').value = '';
  document.getElementById('aiEditPrompt').placeholder = `E.g., "Add a traditional tea ceremony in the afternoon" or "Replace the first activity with something kid-friendly"`;
  document.getElementById('aiEditModal').querySelector('.modal-header-modern h2').textContent = `Edit Day ${dayNum} with AI`;
  openAIEditModal();
}

/**
 * Utility functions
 */
function formatTripMeta(trip) {
  const parts = [];

  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startStr = `${months[start.getMonth()]} ${start.getDate()}`;
    const endStr = `${end.getDate()}, ${start.getFullYear()}`;

    parts.push(`${startStr}-${endStr}`);
    parts.push(`${days} days`);
  }

  if (trip.destination) {
    parts.push(trip.destination);
  }

  return parts.join(' • ');
}

function calculateDayDate(startDate, dayOffset) {
  if (!startDate) return new Date();

  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function formatDate(date) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} (${days[date.getDay()]})`;
}

function getActivityTypeBadge(type) {
  if (!type) return '';

  const typeMap = {
    temple: { label: 'Temple', class: 'activity-type-temple' },
    food: { label: 'Food', class: 'activity-type-food' },
    restaurant: { label: 'Food', class: 'activity-type-food' },
    nature: { label: 'Nature', class: 'activity-type-nature' },
    activity: { label: 'Activity', class: 'activity-type-activity' },
    hotel: { label: 'Hotel', class: 'activity-type-hotel' },
    attraction: { label: 'Attraction', class: 'activity-type-temple' },
    shopping: { label: 'Shopping', class: 'activity-type-activity' }
  };

  const config = typeMap[type.toLowerCase()] || { label: type, class: 'activity-type-activity' };

  return `<span class="activity-type ${config.class}">${config.label}</span>`;
}

function getDefaultActivityImage(type) {
  const imageMap = {
    temple: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80',
    food: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80',
    restaurant: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80',
    nature: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
    hotel: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80',
    attraction: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80'
  };

  return imageMap[type?.toLowerCase()] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80';
}

function getMarkerIcon(type) {
  const iconMap = {
    temple: '⛩️',
    food: '🍜',
    restaurant: '🍜',
    nature: '🌿',
    hotel: '🏨',
    attraction: '🎯',
    activity: '🎪'
  };

  return iconMap[type?.toLowerCase()] || '📍';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function expandDay(dayNum) {
  // Future: Handle collapsed days
  alert('Day expansion coming soon!');
}
