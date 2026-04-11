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
let routeLayers = []; // Track route layers for toggling
let visibleDays = new Set(); // Track which days are visible on map

/**
 * Day colors for multi-day route display
 */
const DAY_COLORS = [
  '#3b82f6', // Blue - Day 1
  '#ef4444', // Red - Day 2
  '#10b981', // Green - Day 3
  '#f59e0b', // Orange - Day 4
  '#8b5cf6', // Purple - Day 5
  '#ec4899', // Pink - Day 6
  '#14b8a6', // Teal - Day 7
  '#f97316', // Deep Orange - Day 8
  '#6366f1', // Indigo - Day 9
  '#84cc16'  // Lime - Day 10
];

/**
 * Get color for a specific day
 */
function getDayColor(dayNumber) {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

/**
 * Toast notification system
 */
function showToast(message, duration = 3000, type = 'info') {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Init] DOMContentLoaded fired');
  console.log('[Init] TripManager available:', !!tripManager);
  console.log('[Init] Storage key:', tripManager?.storageKey);

  loadTripFromURL();
  initializeMap();
});

/**
 * Load trip from URL parameter
 */
function loadTripFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  currentTripId = urlParams.get('trip');

  console.log('[Trip Loader] Trip ID from URL:', currentTripId);

  if (!currentTripId) {
    showToast('No trip ID provided. Redirecting...', 2000, 'error');
    setTimeout(() => window.location.href = 'dashboard.html', 2000);
    return;
  }

  // Debug: Check all trips in storage
  const allTrips = tripManager.getAllTrips();
  console.log('[Trip Loader] All trips in localStorage:', allTrips);
  console.log('[Trip Loader] Number of trips:', allTrips.length);
  console.log('[Trip Loader] Trip IDs:', allTrips.map(t => t.id));

  currentTrip = tripManager.getTrip(currentTripId);
  console.log('[Trip Loader] Found trip:', currentTrip);

  if (!currentTrip) {
    console.error('[Trip Loader] Trip not found in localStorage! ID:', currentTripId);
    console.error('[Trip Loader] Available IDs:', allTrips.map(t => t.id));

    // Try to load from cloud if user is authenticated
    if (typeof authService !== 'undefined' && authService.getCurrentUser()) {
      console.log('[Trip Loader] Attempting to load trip from cloud...');
      loadTripFromCloud(currentTripId);
      return;
    }

    // Show more helpful error
    const errorMsg = allTrips.length === 0
      ? 'No trips found in storage. Please create a trip first.'
      : `Trip "${currentTripId}" not found. Available trips: ${allTrips.map(t => t.name).join(', ')}`;

    showToast(errorMsg, 3000, 'error');
    window.location.href = 'dashboard.html';
    return;
  }

  renderTrip();
}

/**
 * Load trip from cloud when not found in localStorage
 */
async function loadTripFromCloud(tripId) {
  try {
    console.log('[Cloud Loader] Fetching trip from cloud:', tripId);

    const token = await authService.getAccessToken();
    const response = await fetch(`/api/trips/${tripId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load trip: ${response.status}`);
    }

    const cloudTrip = await response.json();
    console.log('[Cloud Loader] Loaded from cloud:', cloudTrip);

    // Save to localStorage
    const tripData = {
      ...cloudTrip.data,
      id: cloudTrip.id,
      cloudSynced: true,
      lastSyncAt: new Date().toISOString()
    };

    const savedTrip = tripManager.createTrip(tripData);
    currentTrip = savedTrip;

    renderTrip();
  } catch (error) {
    console.error('[Cloud Loader] Failed to load trip from cloud:', error);
    showToast('Trip not found. Redirecting to dashboard...', 2000, 'error');
    window.location.href = 'dashboard.html';
  }
}

/**
 * Render trip budget overview in header
 */
function renderTripBudgetOverview() {
  const totalBudget = calculateTripBudget(currentTrip);
  const currency = currentTrip?.currency || 'USD';

  // Find or create budget display element
  let budgetDisplay = document.querySelector('.trip-budget-overview');

  if (!budgetDisplay && totalBudget > 0) {
    // Create budget display if it doesn't exist
    budgetDisplay = document.createElement('div');
    budgetDisplay.className = 'trip-budget-overview';

    const tripTitleArea = document.querySelector('.trip-title-area');
    if (tripTitleArea) {
      tripTitleArea.appendChild(budgetDisplay);
    }
  }

  if (budgetDisplay) {
    if (totalBudget > 0) {
      budgetDisplay.innerHTML = `
        <div class="budget-display">
          <div class="budget-label">Total Budget:</div>
          <div class="budget-amount">${formatCurrency(totalBudget, currency)}</div>
          <select class="currency-selector" onchange="updateTripCurrency(this.value)">
            ${renderCurrencyOptions(currency)}
          </select>
        </div>
      `;
      budgetDisplay.style.display = 'flex';
    } else {
      budgetDisplay.style.display = 'none';
    }
  }
}

/**
 * Render currency selector options
 */
function renderCurrencyOptions(selectedCurrency = 'USD') {
  const currencies = [
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
    { code: 'CNY', name: 'Chinese Yuan (¥)' },
    { code: 'KRW', name: 'Korean Won (₩)' },
    { code: 'THB', name: 'Thai Baht (฿)' },
    { code: 'SGD', name: 'Singapore Dollar (S$)' },
    { code: 'MYR', name: 'Malaysian Ringgit (RM)' },
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' }
  ];

  return currencies.map(curr =>
    `<option value="${curr.code}" ${curr.code === selectedCurrency ? 'selected' : ''}>${curr.name}</option>`
  ).join('');
}

/**
 * Update trip currency
 */
function updateTripCurrency(newCurrency) {
  if (!currentTrip) return;

  currentTrip.currency = newCurrency;
  tripManager.updateTrip(currentTripId, currentTrip);

  // Re-render to update all currency displays
  renderTrip();

  showToast(`Currency updated to ${newCurrency}`, 2000, 'success');
}

/**
 * Render trip data to the page
 */
function renderTrip() {
  if (!currentTrip) return;

  // Update header
  document.querySelector('.trip-title').textContent = currentTrip.name || 'Untitled Trip';
  document.querySelector('.trip-meta').textContent = formatTripMeta(currentTrip);
  document.title = `${currentTrip.name} | Wahgola`;

  // Add or update budget overview in header
  renderTripBudgetOverview();

  // Render days (includes summary and checklist placeholders)
  const itineraryPanel = document.querySelector('.itinerary-panel');
  itineraryPanel.innerHTML = renderDays(currentTrip.days || []);

  // Update day selector dropdown
  updateDaySelector();

  // Update map
  if (currentTrip.days && currentTrip.days.length > 0) {
    updateMapMarkers();
  }

  // Populate summary and checklist after rendering
  setTimeout(() => {
    displayTripSummary();
    buildTripChecklist();
  }, 100);
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

  // Include summary and checklist cards at the top
  let html = '';

  // Trip Summary Card (will be populated by displayTripSummary)
  html += `
    <section class="trip-summary-card" id="tripSummaryCard" style="display: none;">
      <div class="summary-header">
        <h3>Trip Overview</h3>
        <button class="summary-refresh-btn" onclick="regenerateSummary()" title="Regenerate summary with AI">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </button>
      </div>
      <div class="summary-content" id="tripSummaryContent">
        <div class="summary-skeleton">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </section>
  `;

  // Trip Checklist Card (will be populated by buildTripChecklist)
  html += `
    <section class="trip-checklist-card" id="tripChecklistCard" style="display: none;">
      <div class="checklist-header">
        <h3>Trip Checklist</h3>
        <button class="checklist-toggle-btn" onclick="toggleChecklistExpand()" id="checklistToggleBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
      <div class="checklist-content" id="checklistContent">
        <div class="checklist-categories">
          <!-- To Eat -->
          <div class="checklist-category">
            <div class="checklist-category-header">
              <span class="checklist-icon">🍽️</span>
              <h4>To Eat</h4>
              <span class="checklist-count" id="eatCount">0</span>
            </div>
            <div class="checklist-items" id="eatList">
              <p class="checklist-empty">No food items yet</p>
            </div>
          </div>

          <!-- To Shop -->
          <div class="checklist-category">
            <div class="checklist-category-header">
              <span class="checklist-icon">🛍️</span>
              <h4>To Shop</h4>
              <span class="checklist-count" id="shopCount">0</span>
            </div>
            <div class="checklist-items" id="shopList">
              <p class="checklist-empty">No shopping items yet</p>
            </div>
          </div>

          <!-- To Play -->
          <div class="checklist-category">
            <div class="checklist-category-header">
              <span class="checklist-icon">🎮</span>
              <h4>To Play</h4>
              <span class="checklist-count" id="playCount">0</span>
            </div>
            <div class="checklist-items" id="playList">
              <p class="checklist-empty">No activities yet</p>
            </div>
          </div>

          <!-- To Stay -->
          <div class="checklist-category">
            <div class="checklist-category-header">
              <span class="checklist-icon">🏨</span>
              <h4>To Stay</h4>
              <span class="checklist-count" id="stayCount">0</span>
            </div>
            <div class="checklist-items" id="stayList">
              <p class="checklist-empty">No accommodations yet</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Add all day cards
  html += days.map((day, index) => renderDayCard(day, index + 1)).join('');

  return html;
}

/**
 * Render day budget total
 */
function renderDayBudget(day) {
  const dayBudget = calculateDayBudget(day);
  if (dayBudget <= 0) return '';

  const currency = currentTrip?.currency || 'USD';
  const formatted = formatCurrency(dayBudget, currency);

  return `
    <div class="day-budget-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v12M15 9H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H9"></path>
      </svg>
      <span>${formatted}</span>
    </div>
  `;
}

/**
 * Render a single day card
 */
function renderDayCard(day, dayNumber) {
  const activities = day.activities || [];
  const date = calculateDayDate(currentTrip.startDate, dayNumber - 1);

  return `
    <section class="day-card" data-day="${dayNumber}">
      <div class="day-card-header">
        <div class="day-number-badge">Day ${dayNumber}</div>
        <div class="day-info">
          <h2 class="day-title">${escapeHtml(day.title || `Day ${dayNumber}`)}</h2>
          <p class="day-date">${formatDate(date)}</p>
          ${renderDayBudget(day)}
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
          <button class="day-action-btn" onclick="openDuplicateDayModal(${dayNumber})" title="Duplicate day">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
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
  const placeholderUrl = activity.image || getDefaultActivityImage(activity.location?.type);

  // Generate unique ID for this activity
  const activityId = `activity-${dayNumber}-${activityIndex}`;

  const imageHtml = hasImage ? `
    <div class="activity-image-wrapper">
      <img id="${activityId}-img"
           src="${placeholderUrl}"
           alt="${escapeHtml(activity.name)}"
           class="activity-image"
           data-poi-name="${escapeHtml(activity.name)}"
           data-location='${JSON.stringify(activity.location || {})}'>
    </div>
  ` : '';

  // Fetch real POI image asynchronously (after render)
  // Always try to load POI images, even if service isn't loaded yet
  if (hasImage) {
    setTimeout(() => loadPOIImage(activityId, activity), 500);
  }

  return `
    <div class="activity-item activity-card ${hasImage ? 'activity-with-image' : ''}" data-day="${dayNumber}" data-activity="${activityIndex}">
      <div class="activity-time-wrapper">
        <span class="time-badge activity-time">${escapeHtml(activity.time || '')}</span>
      </div>
      <div class="activity-content">
        ${imageHtml}

        <div class="activity-header">
          <h3 class="activity-name activity-title">${escapeHtml(activity.name)}</h3>
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
 * Load POI image asynchronously
 */
async function loadPOIImage(activityId, activity) {
  const imgEl = document.getElementById(`${activityId}-img`);
  if (!imgEl) {
    console.warn(`⚠️ Image element not found for ${activityId}`);
    return;
  }

  // Wait for POI service to be available
  if (!window.poiImageService) {
    console.log(`⏳ Waiting for POI service to load for "${activity.name}"...`);
    // Try again after a short delay
    setTimeout(() => loadPOIImage(activityId, activity), 500);
    return;
  }

  try {
    console.log(`🔍 Fetching POI image for "${activity.name}"...`);
    const imageData = await window.poiImageService.getImage(
      activity.name,
      activity.location,
      activity.location?.type
    );

    if (imageData && imageData.imageUrl) {
      // Fade transition for smooth loading
      imgEl.style.opacity = '0.5';
      imgEl.src = imageData.imageUrl;

      imgEl.onload = () => {
        imgEl.style.transition = 'opacity 0.3s';
        imgEl.style.opacity = '1';
      };

      // Log for debugging
      console.log(`🖼️ Loaded image for "${activity.name}" from ${imageData.source} ${imageData.cached ? '(cached)' : '(fresh)'}`);
    }
  } catch (error) {
    console.warn(`Failed to load POI image for "${activity.name}":`, error);
    // Keep placeholder image on error
  }
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

  if (activity.cost !== undefined && activity.cost !== null && activity.cost !== '') {
    const currency = currentTrip?.currency || 'USD';
    const formattedCost = formatCurrency(activity.cost, currency);
    items.push(`
      <div class="meta-item meta-item-cost">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v12M15 9H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H9"></path>
        </svg>
        <span class="cost-value">${formattedCost}</span>
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

  // Add edit button
  actions.push(`
    <button class="activity-action-btn" onclick="openEditActivityModal(${dayNumber}, ${activityIndex})">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      Edit
    </button>
  `);

  return actions.length > 0 ? `<div class="activity-actions">${actions.join('')}</div>` : '';
}

/**
 * Format currency with symbol
 */
function formatCurrency(amount, currency = 'USD') {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'KRW': '₩',
    'THB': '฿',
    'SGD': 'S$',
    'MYR': 'RM',
    'INR': '₹',
    'AUD': 'A$'
  };

  const symbol = symbols[currency] || currency;
  const num = parseFloat(amount);

  if (isNaN(num)) return symbol + '0';

  // For JPY and KRW, no decimals
  if (currency === 'JPY' || currency === 'KRW') {
    return symbol + Math.round(num).toLocaleString();
  }

  return symbol + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate daily budget total
 */
function calculateDayBudget(day) {
  if (!day || !day.activities) return 0;

  return day.activities.reduce((total, activity) => {
    const cost = parseFloat(activity.cost) || 0;
    return total + cost;
  }, 0);
}

/**
 * Calculate trip total budget
 */
function calculateTripBudget(trip) {
  if (!trip || !trip.days) return 0;

  return trip.days.reduce((total, day) => {
    return total + calculateDayBudget(day);
  }, 0);
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
    const token = window.MAPBOX_CONFIG.token;
    console.log('Token from config:', token);
    console.log('Token length:', token.length);
    console.log('Token starts with pk.:', token.startsWith('pk.'));

    mapboxgl.accessToken = token;
    console.log('Mapbox token set, creating map...');
    console.log('mapboxgl.accessToken:', mapboxgl.accessToken);

    // Get initial center from trip data
    const initialCenter = getInitialMapCenter();

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12', // Detailed street map for travel planning
      center: initialCenter,
      zoom: 11,
      attributionControl: true
    });

    map.on('load', () => {
      console.log('Map loaded successfully ✅');
      updateMapMarkers();
      setupDaySelector();
    });

    map.on('error', (e) => {
      console.error('Map error:', e);
      console.error('Full error object:', JSON.stringify(e, null, 2));

      // Extract actual error message
      const errorMsg = e.error?.message || e.message || 'Unknown error';
      showMapError(`Map error: ${errorMsg}`);
    });

    map.addControl(new mapboxgl.NavigationControl());
  } catch (err) {
    console.error('Map initialization error:', err);
    showMapError(err.message);
  }
}

/**
 * Get initial map center from trip's first location
 */
function getInitialMapCenter() {
  if (!currentTrip || !currentTrip.days || currentTrip.days.length === 0) {
    return [135.7681, 35.0116]; // Default to Kyoto
  }

  // Try to find first activity with location
  for (const day of currentTrip.days) {
    if (day.activities && day.activities.length > 0) {
      for (const activity of day.activities) {
        if (activity.location && activity.location.lat && activity.location.lng) {
          return [activity.location.lng, activity.location.lat];
        }
      }
    }
  }

  return [135.7681, 35.0116]; // Fallback to Kyoto
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

  // Initialize all days as visible if not set
  if (visibleDays.size === 0) {
    currentTrip.days.forEach((_, index) => {
      visibleDays.add(index + 1);
    });
  }

  // Clear existing markers
  markers.forEach(marker => marker.remove());
  markers = [];

  // Clear existing route layers
  routeLayers.forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
    }
  });
  routeLayers = [];

  const allLocations = [];

  // Process each day
  currentTrip.days.forEach((day, dayIndex) => {
    const dayNumber = dayIndex + 1;
    const dayColor = getDayColor(dayNumber);
    const isDayVisible = visibleDays.has(dayNumber);

    if (!day.activities) return;

    const dayLocations = [];

    // Collect locations for this day
    day.activities.forEach((activity, actIndex) => {
      if (activity.location && activity.location.lat && activity.location.lng) {
        const loc = {
          ...activity.location,
          activityName: activity.name,
          dayNumber: dayNumber,
          activityIndex: actIndex
        };
        dayLocations.push(loc);
        allLocations.push(loc);
      }
    });

    // Add markers for this day
    if (isDayVisible) {
      dayLocations.forEach((loc, index) => {
        const el = document.createElement('div');
        el.className = 'map-marker';
        el.innerHTML = `<div class="marker-number">${index + 1}</div>`;
        el.style.cssText = `
          width: 36px;
          height: 36px;
          background: ${dayColor};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-weight: 700;
          font-size: 13px;
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([loc.lng, loc.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 4px;">
                <div style="color: ${dayColor}; font-weight: 600; margin-bottom: 4px;">Day ${dayNumber}</div>
                <strong>${loc.activityName}</strong>
                ${loc.address ? `<br><small style="color: #666;">${loc.address}</small>` : ''}
              </div>
            `))
          .addTo(map);

        markers.push(marker);
      });

      // Add route line for this day
      if (dayLocations.length > 1) {
        const coordinates = dayLocations.map(loc => [loc.lng, loc.lat]);
        const routeId = `route-day-${dayNumber}`;

        // Add route source
        map.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });

        // Add route layer
        map.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': dayColor,
            'line-width': 3,
            'line-opacity': 0.8
          }
        });

        routeLayers.push(routeId);
      }
    }
  });

  // Fit bounds if locations exist
  if (allLocations.length > 0) {
    const visibleLocations = allLocations.filter(loc => visibleDays.has(loc.dayNumber));
    if (visibleLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      visibleLocations.forEach(loc => bounds.extend([loc.lng, loc.lat]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    }
  }

  // Update day toggle UI
  updateDayToggleUI();
}

/**
 * Toggle day visibility on map
 */
function toggleDayOnMap(dayNumber) {
  if (visibleDays.has(dayNumber)) {
    visibleDays.delete(dayNumber);
  } else {
    visibleDays.add(dayNumber);
  }

  updateMapMarkers();
}

/**
 * Show all days on map
 */
function showAllDays() {
  visibleDays.clear();
  currentTrip.days.forEach((_, index) => {
    visibleDays.add(index + 1);
  });
  updateMapMarkers();
}

/**
 * Hide all days on map
 */
function hideAllDays() {
  visibleDays.clear();
  updateMapMarkers();
}

/**
 * Update day toggle UI
 */
function updateDayToggleUI() {
  const container = document.getElementById('dayToggleContainer');
  if (!container || !currentTrip || !currentTrip.days) return;

  const html = `
    <div class="day-toggle-header">
      <span class="day-toggle-title">Routes</span>
      <div class="day-toggle-actions">
        <button class="day-toggle-all-btn" onclick="showAllDays()" title="Show all">All</button>
        <button class="day-toggle-all-btn" onclick="hideAllDays()" title="Hide all">None</button>
      </div>
    </div>
    <div class="day-toggle-chips">
      ${currentTrip.days.map((day, index) => {
        const dayNumber = index + 1;
        const dayColor = getDayColor(dayNumber);
        const isVisible = visibleDays.has(dayNumber);
        return `
          <button
            class="day-toggle-chip ${isVisible ? 'active' : ''}"
            onclick="toggleDayOnMap(${dayNumber})"
            style="--day-color: ${dayColor};"
          >
            <span class="day-chip-dot" style="background: ${dayColor};"></span>
            <span>Day ${dayNumber}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  container.innerHTML = html;
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
 * Current editing state
 */
let currentEditDayIndex = null;
let isManualEditMode = false;
let pendingAIChanges = null;

/**
 * Manual editing function - makes day content editable
 */
function editDay(dayNum) {
  const dayIndex = dayNum - 1;
  currentEditDayIndex = dayIndex;
  isManualEditMode = true;

  // Find the day card
  const dayCard = document.querySelector(`[data-day="${dayNum}"]`);
  if (!dayCard) {
    showToast('Day not found', 2000, 'error');
    return;
  }

  // Make all activities editable
  const activities = dayCard.querySelectorAll('.activity-title, .activity-description, .activity-time');
  activities.forEach(el => {
    el.contentEditable = 'true';
    el.style.outline = '2px dashed #007bff';
    el.style.padding = '4px';
  });

  // Show save/cancel buttons
  const dayActions = dayCard.querySelector('.day-actions');
  dayActions.innerHTML = `
    <button class="btn-primary" onclick="saveDayEdits(${dayNum})">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Save Changes</span>
    </button>
    <button class="btn-secondary" onclick="cancelDayEdits(${dayNum})">Cancel</button>
  `;
}

/**
 * Save manual edits to a day
 */
function saveDayEdits(dayNum) {
  const dayIndex = dayNum - 1;
  const dayCard = document.querySelector(`[data-day="${dayNum}"]`);

  if (!dayCard || !currentTrip || !currentTrip.days[dayIndex]) {
    showToast('Error saving changes', 2000, 'error');
    return;
  }

  // Collect edited data
  const activities = dayCard.querySelectorAll('.activity-card');
  const updatedActivities = [];

  activities.forEach(activityEl => {
    const title = activityEl.querySelector('.activity-title')?.textContent?.trim();
    const description = activityEl.querySelector('.activity-description')?.textContent?.trim();
    const time = activityEl.querySelector('.activity-time')?.textContent?.trim();

    if (title) {
      updatedActivities.push({
        time: time || '9:00 AM',
        title: title,
        description: description || '',
        location: currentTrip.days[dayIndex].activities[updatedActivities.length]?.location || null
      });
    }
  });

  // Update trip data
  currentTrip.days[dayIndex].activities = updatedActivities;
  tripManager.updateTrip(currentTripId, currentTrip);

  console.log('[Manual Edit] Saved changes to day', dayNum);

  // Reload page to show changes
  showToast('Changes saved! Refreshing...', 1500, 'success');
  setTimeout(() => window.location.reload(), 1500);
}

/**
 * Cancel manual edits
 */
function cancelDayEdits(dayNum) {
  window.location.reload();
}

/**
 * AI Edit Day function
 */
function editDayWithAI(dayNum) {
  currentEditDayIndex = dayNum - 1;
  isManualEditMode = false;

  document.getElementById('aiEditPrompt').value = '';
  document.getElementById('aiEditPrompt').placeholder = `E.g., "Add a traditional tea ceremony in the afternoon" or "Replace the first activity with something kid-friendly"`;

  const modal = document.getElementById('aiEditModal');
  if (modal) {
    const header = modal.querySelector('h2');
    if (header) {
      header.textContent = `Edit Day ${dayNum} with AI`;
    }
    modal.style.display = 'flex';
    document.getElementById('aiEditPrompt')?.focus();
  }
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
  showToast('Day expansion coming soon!', 2000, 'info');
}

/**
 * Update day selector dropdown to match trip length
 */
function updateDaySelector() {
  const daySelect = document.getElementById('daySelect');
  if (!daySelect || !currentTrip || !currentTrip.days) return;

  const numDays = currentTrip.days.length;

  // Build options
  let options = '<option value="all">All Locations</option>';
  for (let i = 1; i <= numDays; i++) {
    const dayTitle = currentTrip.days[i - 1]?.title || `Day ${i}`;
    options += `<option value="${i}">Day ${i}</option>`;
  }

  daySelect.innerHTML = options;
}

/**
 * Setup day selector event listener
 */
function setupDaySelector() {
  const daySelect = document.getElementById('daySelect');
  if (!daySelect) return;

  daySelect.addEventListener('change', (e) => {
    const selectedDay = e.target.value;
    filterMapByDay(selectedDay);
  });
}

/**
 * Filter map markers and draw routes by day
 */
function filterMapByDay(day) {
  if (!map || !currentTrip || !currentTrip.days) return;

  // Remove existing route
  if (map.getLayer('route')) {
    map.removeLayer('route');
  }
  if (map.getSource('route')) {
    map.removeSource('route');
  }

  if (day === 'all') {
    // Show all markers
    markers.forEach(marker => marker.getElement().style.opacity = '1');

    // Fit all markers
    if (markers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(marker => bounds.extend(marker.getLngLat()));
      map.fitBounds(bounds, { padding: 50 });
    }
  } else {
    const dayNum = parseInt(day);
    const dayLocations = [];

    // Collect locations for selected day
    const selectedDay = currentTrip.days[dayNum - 1];
    if (selectedDay && selectedDay.activities) {
      selectedDay.activities.forEach(activity => {
        if (activity.location && activity.location.lat && activity.location.lng) {
          dayLocations.push({
            lng: activity.location.lng,
            lat: activity.location.lat,
            name: activity.name
          });
        }
      });
    }

    // Update marker opacity
    markers.forEach(marker => {
      const markerPos = marker.getLngLat();
      const isInDay = dayLocations.some(loc =>
        Math.abs(loc.lng - markerPos.lng) < 0.0001 &&
        Math.abs(loc.lat - markerPos.lat) < 0.0001
      );
      marker.getElement().style.opacity = isInDay ? '1' : '0.3';
    });

    // Draw route for the day
    if (dayLocations.length > 1) {
      drawRoute(dayLocations);
    }

    // Fit bounds to day locations
    if (dayLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      dayLocations.forEach(loc => bounds.extend([loc.lng, loc.lat]));
      map.fitBounds(bounds, { padding: 80 });
    }
  }
}

/**
 * Draw route between locations using Mapbox Directions API
 */
async function drawRoute(locations) {
  if (!map || locations.length < 2) return;

  const coordinates = locations.map(l => `${l.lng},${l.lat}`).join(';');

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
    );

    const data = await response.json();

    if (data.routes && data.routes[0]) {
      const route = data.routes[0].geometry;

      // Add route to map
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: route
        }
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 4,
          'line-opacity': 0.75
        }
      });
    }
  } catch (error) {
    console.error('Error drawing route:', error);
  }
}

/**
 * AI Edit Modal Functions
 */
function openAIEditModal() {
  const modal = document.getElementById('aiEditModal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('aiEditPrompt')?.focus();
  }
}

function closeAIEditModal() {
  const modal = document.getElementById('aiEditModal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('aiEditPrompt').value = '';
    currentEditDayIndex = null;
  }
}

async function submitAIEdit() {
  const prompt = document.getElementById('aiEditPrompt')?.value?.trim();

  if (!prompt) {
    showToast('Please describe what you\'d like to change', 2000, 'warning');
    return;
  }

  if (!currentTrip) {
    showToast('No trip loaded', 2000, 'error');
    return;
  }

  // Initialize days array if it doesn't exist (for new trips)
  if (!currentTrip.days) {
    currentTrip.days = [];
  }

  // Disable button and show loading
  const submitBtn = event.target.closest('button');
  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>Generating...</span>';

  try {
    const isWholeTrip = currentEditDayIndex === null;
    console.log('[AI Edit] Submitting edit request:', {
      prompt,
      dayIndex: currentEditDayIndex,
      isWholeTrip
    });

    // If editing whole trip, show note to user
    if (isWholeTrip) {
      showToast('Editing entire trip may take a moment...', 3000, 'info');
    }

    const response = await fetch('/api/ai-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        currentDay: currentEditDayIndex !== null ? currentTrip.days[currentEditDayIndex] : null,
        allDays: isWholeTrip ? currentTrip.days : null,
        tripContext: {
          destination: currentTrip.destination,
          totalDays: currentTrip.days.length,
          isWholeTrip: isWholeTrip
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.userMessage || error.error || 'Failed to generate changes');
    }

    const result = await response.json();
    console.log('[AI Edit] Received result:', result);

    if (isWholeTrip) {
      // For whole trip edits, we get an array of days
      const updatedDays = result.days || result;

      if (!Array.isArray(updatedDays)) {
        throw new Error('Invalid response format for whole trip edit');
      }

      // Validate coordinates for all days
      updatedDays.forEach(day => {
        if (day.activities) {
          day.activities = day.activities.map(activity => {
            if (activity.location) {
              activity.location = validateCoordinates(activity.location, currentTrip.destination);
            }
            return activity;
          });
        }
      });

      // Apply changes directly (whole trip edits are auto-applied)
      currentTrip.days = updatedDays;
      tripManager.updateTrip(currentTripId, currentTrip);

      closeAIEditModal();
      renderTrip();

      showToast('Trip updated successfully!', 2000, 'success');

    } else {
      // For single day edits, show preview
      const updatedDay = result;

      // Validate and fix coordinates
      updatedDay.activities = updatedDay.activities.map(activity => {
        if (activity.location) {
          activity.location = validateCoordinates(activity.location, currentTrip.destination);
        }
        return activity;
      });

      // Store pending changes
      pendingAIChanges = updatedDay;

      // Show preview modal
      closeAIEditModal();
      showAIPreview(updatedDay);
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;

  } catch (error) {
    console.error('[AI Edit] Error:', error);
    showToast(`Failed to generate changes: ${error.message}`, 4000, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }
}

/**
 * Show AI changes preview
 */
function showAIPreview(updatedDay) {
  const modal = document.getElementById('aiPreviewModal');
  const previewContent = document.getElementById('aiPreviewContent');

  if (!modal || !previewContent) return;

  // Generate comparison HTML
  const originalDay = currentTrip.days[currentEditDayIndex];

  let html = `
    <div class="preview-header">
      <h3>Day ${currentEditDayIndex + 1}: ${updatedDay.title || originalDay.title}</h3>
      <p class="preview-note">Compare the changes below and approve to apply them</p>
    </div>

    <div class="preview-sections">
      <div class="preview-section">
        <h4>Original Activities (${originalDay.activities?.length || 0})</h4>
        <div class="preview-list">
          ${(originalDay.activities || []).map(act => `
            <div class="preview-activity preview-old">
              <div class="preview-time">${act.time || ''}</div>
              <div class="preview-details">
                <strong>${act.name || act.title || ''}</strong>
                <p>${act.details || act.description || ''}</p>
                ${act.location ? `<small>📍 ${act.location.name || ''}</small>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="preview-divider">→</div>

      <div class="preview-section">
        <h4>Updated Activities (${updatedDay.activities?.length || 0})</h4>
        <div class="preview-list">
          ${(updatedDay.activities || []).map(act => `
            <div class="preview-activity preview-new">
              <div class="preview-time">${act.time || ''}</div>
              <div class="preview-details">
                <strong>${act.name || act.title || ''}</strong>
                <p>${act.details || act.description || ''}</p>
                ${act.location ? `<small>📍 ${act.location.name || ''} ${act.location.lat && act.location.lng ? `(${act.location.lat.toFixed(4)}, ${act.location.lng.toFixed(4)})` : ''}</small>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  previewContent.innerHTML = html;
  modal.style.display = 'flex';
}

/**
 * Close AI preview modal
 */
function closeAIPreviewModal() {
  const modal = document.getElementById('aiPreviewModal');
  if (modal) {
    modal.style.display = 'none';
  }
  pendingAIChanges = null;
}

/**
 * Approve and apply AI changes
 */
function approveAIChanges() {
  if (!pendingAIChanges || currentEditDayIndex === null) {
    showToast('No changes to apply', 2000, 'error');
    return;
  }

  // Update the trip
  if (currentEditDayIndex < currentTrip.days.length) {
    currentTrip.days[currentEditDayIndex] = pendingAIChanges;
  }

  // Save to localStorage
  tripManager.updateTrip(currentTripId, currentTrip);
  console.log('[AI Edit] Trip updated in localStorage');

  // Reload the page to show changes
  closeAIPreviewModal();
  showToast('Changes applied successfully! Refreshing...', 1500, 'success');
  setTimeout(() => window.location.reload(), 1500);
}

/**
 * Validate GPS coordinates for a location
 */
function validateCoordinates(location, destination) {
  if (!location || !location.lat || !location.lng) {
    return location;
  }

  // Define valid coordinate ranges for common destinations
  const coordinateRanges = {
    // Japan
    'tokyo': { minLat: 35.5, maxLat: 35.9, minLng: 139.5, maxLng: 140.0 },
    'kyoto': { minLat: 34.9, maxLat: 35.2, minLng: 135.6, maxLng: 135.9 },
    'osaka': { minLat: 34.5, maxLat: 34.9, minLng: 135.3, maxLng: 135.7 },
    'fukuoka': { minLat: 33.5, maxLat: 33.7, minLng: 130.3, maxLng: 130.5 },

    // Southeast Asia
    'singapore': { minLat: 1.2, maxLat: 1.5, minLng: 103.6, maxLng: 104.0 },
    'bangkok': { minLat: 13.6, maxLat: 13.9, minLng: 100.4, maxLng: 100.7 },
    'kuala lumpur': { minLat: 3.0, maxLat: 3.3, minLng: 101.5, maxLng: 101.8 },

    // Default: world coordinates
    'default': { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180 }
  };

  // Find matching range
  const destLower = (destination || '').toLowerCase();
  let range = coordinateRanges.default;

  for (const [key, value] of Object.entries(coordinateRanges)) {
    if (destLower.includes(key)) {
      range = value;
      break;
    }
  }

  // Check if coordinates are within valid range
  const lat = parseFloat(location.lat);
  const lng = parseFloat(location.lng);

  if (isNaN(lat) || isNaN(lng)) {
    console.warn(`Invalid coordinates for ${location.name}:`, location.lat, location.lng);
    return location;
  }

  if (lat < range.minLat || lat > range.maxLat || lng < range.minLng || lng > range.maxLng) {
    console.warn(`Coordinates out of range for ${location.name} in ${destination}:`, { lat, lng, range });

    // Set to center of range as fallback
    location.lat = (range.minLat + range.maxLat) / 2;
    location.lng = (range.minLng + range.maxLng) / 2;
    location.coordinatesValidated = false;

    showToast(`⚠️ GPS coordinates for "${location.name}" were corrected to ${destination} center`, 4000, 'warning');
  } else {
    location.coordinatesValidated = true;
  }

  return location;
}

// Generate Changes button now has onclick="submitAIEdit()" in HTML

/**
 * ============================================
 * SEARCH & FILTER FUNCTIONALITY
 * ============================================
 */

let currentSearchQuery = '';
let currentFilterType = 'all';

/**
 * Handle activity search
 */
function handleActivitySearch(query) {
  currentSearchQuery = query.toLowerCase().trim();
  
  // Show/hide clear button
  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) {
    clearBtn.style.display = currentSearchQuery ? 'block' : 'none';
  }
  
  applyFilters();
}

/**
 * Open search panel
 */
function openSearchPanel() {
  const panel = document.getElementById('searchPanel');
  const overlay = document.getElementById('searchPanelOverlay');

  if (panel) panel.classList.add('active');
  if (overlay) overlay.classList.add('active');

  // Focus search input
  setTimeout(() => {
    const searchInput = document.getElementById('activitySearch');
    if (searchInput) searchInput.focus();
  }, 300);
}

/**
 * Close search panel
 */
function closeSearchPanel() {
  const panel = document.getElementById('searchPanel');
  const overlay = document.getElementById('searchPanelOverlay');

  if (panel) panel.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

/**
 * Clear search
 */
function clearSearch() {
  const searchInput = document.getElementById('activitySearch');
  if (searchInput) {
    searchInput.value = '';
  }
  currentSearchQuery = '';

  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) {
    clearBtn.style.display = 'none';
  }

  applyFilters();
}

/**
 * Handle activity type filter
 */
function handleActivityFilter(type) {
  currentFilterType = type;
  
  // Update active state on filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    if (chip.dataset.type === type) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
  
  applyFilters();
}

/**
 * Apply both search and filter
 */
function applyFilters() {
  if (!currentTrip || !currentTrip.days) return;
  
  let totalActivities = 0;
  let visibleActivities = 0;
  
  // Iterate through all days
  currentTrip.days.forEach((day, dayIndex) => {
    const dayCard = document.querySelector(`[data-day="${dayIndex + 1}"]`);
    if (!dayCard) return;
    
    let dayHasVisibleActivities = false;
    
    // Filter activities in this day
    const activities = dayCard.querySelectorAll('.activity-item');
    activities.forEach((activityEl, actIndex) => {
      totalActivities++;
      
      const activity = day.activities[actIndex];
      if (!activity) return;
      
      // Check search match
      const searchMatch = !currentSearchQuery || 
        (activity.name && activity.name.toLowerCase().includes(currentSearchQuery)) ||
        (activity.title && activity.title.toLowerCase().includes(currentSearchQuery)) ||
        (activity.details && activity.details.toLowerCase().includes(currentSearchQuery)) ||
        (activity.description && activity.description.toLowerCase().includes(currentSearchQuery));
      
      // Check type filter match
      const typeMatch = currentFilterType === 'all' || 
        (activity.location && activity.location.type === currentFilterType);
      
      // Show/hide activity
      if (searchMatch && typeMatch) {
        activityEl.classList.remove('filtered-hidden');
        visibleActivities++;
        dayHasVisibleActivities = true;
      } else {
        activityEl.classList.add('filtered-hidden');
      }
    });
    
    // Mark day card if all activities are hidden
    if (dayHasVisibleActivities) {
      dayCard.classList.remove('all-filtered');
    } else {
      dayCard.classList.add('all-filtered');
    }
  });
  
  // Update results counter
  updateResultsCounter(visibleActivities, totalActivities);
}

/**
 * Update results counter display
 */
function updateResultsCounter(visible, total) {
  // Legacy counter
  const counter = document.getElementById('resultsCounter');
  const text = document.getElementById('resultsText');

  if (counter && text) {
    if (visible === total) {
      counter.style.display = 'none';
    } else {
      counter.style.display = 'block';
      text.textContent = `Showing ${visible} of ${total} activities`;
    }
  }

  // Search panel counter
  const panelCounter = document.getElementById('searchResultsCounter');
  const panelText = document.getElementById('searchResultsText');

  if (panelCounter && panelText) {
    if (visible === total && !currentSearchQuery && currentFilterType === 'all') {
      panelCounter.style.display = 'none';
    } else {
      panelCounter.style.display = 'block';
      panelText.textContent = `${visible} of ${total} activities match`;
    }
  }
}

/**
 * Initialize filter chips on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Set "All" filter as active by default
  const allChip = document.querySelector('.filter-chip[data-type="all"]');
  if (allChip) {
    allChip.classList.add('active');
  }
});

/**
 * ============================================
 * DUPLICATE DAY FUNCTIONALITY
 * ============================================
 */

let currentDuplicateDay = null;

/**
 * Open duplicate day modal
 */
function openDuplicateDayModal(dayNum) {
  const modal = document.getElementById('duplicateDayModal');
  if (!modal || !currentTrip || !currentTrip.days[dayNum - 1]) return;
  
  currentDuplicateDay = dayNum;
  
  // Update source day preview
  const day = currentTrip.days[dayNum - 1];
  const activitiesCount = day.activities ? day.activities.length : 0;
  
  document.getElementById('sourceDayPreview').innerHTML = `
    <strong>Day ${dayNum}: ${day.title || `Day ${dayNum}`}</strong>
    <span>${activitiesCount} ${activitiesCount === 1 ? 'activity' : 'activities'}</span>
  `;
  
  // Populate replace day select
  const replaceSelect = document.getElementById('replaceDaySelect');
  replaceSelect.innerHTML = '<option value="">Select day to replace...</option>';
  
  currentTrip.days.forEach((d, idx) => {
    if (idx + 1 !== dayNum) { // Don't allow replacing with itself
      replaceSelect.innerHTML += `<option value="${idx + 1}">Day ${idx + 1}: ${d.title || `Day ${idx + 1}`}</option>`;
    }
  });
  
  // Set up mode toggle
  const modeRadios = document.querySelectorAll('input[name="duplicateMode"]');
  modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      replaceSelect.style.display = e.target.value === 'replace' ? 'block' : 'none';
    });
  });
  
  modal.style.display = 'flex';
}

/**
 * Close duplicate day modal
 */
function closeDuplicateDayModal() {
  const modal = document.getElementById('duplicateDayModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentDuplicateDay = null;
}

/**
 * Execute day duplication
 */
function executeDuplicateDay() {
  if (!currentDuplicateDay || !currentTrip) {
    showToast('Error: No day selected', 2000, 'error');
    return;
  }
  
  const mode = document.querySelector('input[name="duplicateMode"]:checked').value;
  const sourceDay = currentTrip.days[currentDuplicateDay - 1];
  
  // Deep clone the day
  const clonedDay = JSON.parse(JSON.stringify(sourceDay));
  
  if (mode === 'new') {
    // Add as new day at end
    clonedDay.title = `${clonedDay.title || `Day ${currentDuplicateDay}`} (Copy)`;
    currentTrip.days.push(clonedDay);
    showToast(`Day ${currentDuplicateDay} duplicated as Day ${currentTrip.days.length}`, 2000, 'success');
  } else if (mode === 'replace') {
    // Replace existing day
    const replaceDayNum = parseInt(document.getElementById('replaceDaySelect').value);
    
    if (!replaceDayNum || replaceDayNum === currentDuplicateDay) {
      showToast('Please select a valid day to replace', 2000, 'warning');
      return;
    }
    
    if (!confirm(`Replace Day ${replaceDayNum} with Day ${currentDuplicateDay}? This cannot be undone.`)) {
      return;
    }
    
    clonedDay.title = `${clonedDay.title || `Day ${currentDuplicateDay}`} (Copy)`;
    currentTrip.days[replaceDayNum - 1] = clonedDay;
    showToast(`Day ${replaceDayNum} replaced with Day ${currentDuplicateDay}`, 2000, 'success');
  }
  
  // Save to localStorage
  tripManager.updateTrip(currentTripId, currentTrip);
  
  // Close modal and reload
  closeDuplicateDayModal();
  setTimeout(() => window.location.reload(), 1500);
}

/**
 * ============================================
 * EDIT ACTIVITY FUNCTIONALITY
 * ============================================
 */

let currentEditActivity = null;
let currentEditDay = null;
let currentEditActivityIndex = null;

/**
 * Open edit activity modal
 */
function openEditActivityModal(dayNumber, activityIndex) {
  if (!currentTrip || !currentTrip.days[dayNumber - 1]) {
    showToast('Activity not found', 2000, 'error');
    return;
  }

  const day = currentTrip.days[dayNumber - 1];
  const activity = day.activities[activityIndex];

  if (!activity) {
    showToast('Activity not found', 2000, 'error');
    return;
  }

  currentEditDay = dayNumber;
  currentEditActivityIndex = activityIndex;
  currentEditActivity = activity;

  // Populate form fields
  document.getElementById('editActivityTime').value = activity.time || '';
  document.getElementById('editActivityName').value = activity.name || '';
  document.getElementById('editActivityDescription').value = activity.details || activity.description || '';
  document.getElementById('editActivityDuration').value = activity.duration || '';
  document.getElementById('editActivityCost').value = activity.cost || '';

  // Show modal
  const modal = document.getElementById('editActivityModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Close edit activity modal
 */
function closeEditActivityModal() {
  const modal = document.getElementById('editActivityModal');
  if (modal) {
    modal.style.display = 'none';
  }

  currentEditActivity = null;
  currentEditDay = null;
  currentEditActivityIndex = null;
}

/**
 * Validate time format (e.g., "10:00 AM", "2:30 PM", "14:00")
 */
function validateTimeFormat(timeStr) {
  if (!timeStr) return true; // Empty is OK

  // Match formats like: 10:00 AM, 2:30 PM, 14:00, 9 AM, etc.
  const timeRegex = /^(0?[1-9]|1[0-2]):?([0-5][0-9])?\s?(AM|PM|am|pm)?$|^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(timeStr.trim());
}

/**
 * Save activity edits
 */
function saveActivityEdits() {
  if (!currentTrip || !currentEditDay || currentEditActivityIndex === null) {
    showToast('Error saving activity', 2000, 'error');
    return;
  }

  const dayIndex = currentEditDay - 1;
  const activity = currentTrip.days[dayIndex].activities[currentEditActivityIndex];

  // Get form values
  const time = document.getElementById('editActivityTime').value.trim();
  const name = document.getElementById('editActivityName').value.trim();
  const description = document.getElementById('editActivityDescription').value.trim();
  const duration = document.getElementById('editActivityDuration').value.trim();
  const cost = parseFloat(document.getElementById('editActivityCost').value) || 0;

  // Validation
  if (!name) {
    showToast('Activity name is required', 2000, 'warning');
    return;
  }

  if (time && !validateTimeFormat(time)) {
    showToast('Invalid time format. Use formats like "10:00 AM" or "14:00"', 3000, 'warning');
    return;
  }

  if (cost < 0) {
    showToast('Cost cannot be negative', 2000, 'warning');
    return;
  }

  // Update activity
  activity.time = time || '9:00 AM'; // Default time if empty
  activity.name = name;
  activity.details = description;
  activity.description = description;
  activity.duration = duration;
  activity.cost = cost;

  // Save to localStorage
  tripManager.updateTrip(currentTripId, currentTrip);

  // Close modal
  closeEditActivityModal();

  // Re-render trip to show changes
  renderTrip();

  showToast('Activity updated successfully!', 2000, 'success');
}

/**
 * ============================================
 * TRIP SUMMARY FUNCTIONALITY
 * ============================================
 */

/**
 * Display trip summary if it exists
 */
function displayTripSummary() {
  if (!currentTrip || !currentTrip.summary) return;
  
  const summaryCard = document.getElementById('tripSummaryCard');
  const summaryContent = document.getElementById('tripSummaryContent');
  
  if (!summaryCard || !summaryContent) return;
  
  summaryContent.innerHTML = `
    <p>${currentTrip.summary}</p>
    ${currentTrip.highlights ? `
      <div class="summary-highlights">
        ${currentTrip.highlights.map(h => `<span class="summary-highlight">${h}</span>`).join('')}
      </div>
    ` : ''}
  `;
  
  summaryCard.style.display = 'block';
}

/**
 * Regenerate trip summary with AI
 */
async function regenerateSummary() {
  if (!currentTrip) {
    showToast('No trip loaded', 2000, 'error');
    return;
  }
  
  const summaryContent = document.getElementById('tripSummaryContent');
  if (!summaryContent) return;
  
  // Show loading skeleton
  summaryContent.innerHTML = `
    <div class="summary-skeleton">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  `;
  
  showToast('Generating trip summary...', 2000, 'info');
  
  try {
    const response = await fetch('/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trip: currentTrip
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }
    
    const data = await response.json();
    
    // Update trip with new summary
    currentTrip.summary = data.summary;
    currentTrip.highlights = data.highlights;
    
    // Save to localStorage
    tripManager.updateTrip(currentTripId, currentTrip);
    
    // Display updated summary
    displayTripSummary();
    
    showToast('Summary updated!', 2000, 'success');
    
  } catch (error) {
    console.error('[Summary] Error:', error);
    showToast('Failed to generate summary', 3000, 'error');
    summaryContent.innerHTML = '<p>Failed to generate summary. Please try again.</p>';
  }
}

// Display summary on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    displayTripSummary();
  }, 500);
});

/**
 * ============================================
 * PDF EXPORT FUNCTIONALITY
 * ============================================
 */

/**
 * Export trip to PDF
 */
async function exportToPDF() {
  if (!currentTrip) {
    showToast('No trip data to export', 2000, 'error');
    return;
  }

  showToast('Generating PDF...', 2000, 'info');

  try {
    // Load jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Helper function for wrapped text
    const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * (fontSize * 0.35); // Return height
    };

    // Header - Trip Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Primary blue
    doc.text(currentTrip.name || 'Trip Itinerary', margin, yPos);
    yPos += 12;

    // Trip metadata
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Gray
    const metaText = formatTripMeta(currentTrip);
    doc.text(metaText, margin, yPos);
    yPos += 10;

    // Budget (if available)
    const totalBudget = calculateTripBudget(currentTrip);
    if (totalBudget > 0) {
      const currency = currentTrip?.currency || 'USD';
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // Green
      doc.text(`Total Budget: ${formatCurrency(totalBudget, currency)}`, margin, yPos);
      yPos += 10;
    }

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Trip Summary (if available)
    if (currentTrip.summary) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Trip Overview', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const summaryHeight = addWrappedText(currentTrip.summary, margin, yPos, contentWidth);
      yPos += summaryHeight + 5;

      // Highlights
      if (currentTrip.highlights && currentTrip.highlights.length > 0) {
        yPos += 3;
        currentTrip.highlights.forEach(highlight => {
          checkPageBreak(8);
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(`• ${highlight}`, margin + 5, yPos);
          yPos += 6;
        });
      }

      yPos += 8;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
    }

    // Days and Activities
    currentTrip.days.forEach((day, dayIndex) => {
      const dayNumber = dayIndex + 1;
      const dayColor = getDayColor(dayNumber);

      checkPageBreak(30);

      // Day header
      doc.setFillColor(...hexToRgb(dayColor));
      doc.roundedRect(margin, yPos - 6, contentWidth, 12, 3, 3, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`Day ${dayNumber}: ${day.title || `Day ${dayNumber}`}`, margin + 5, yPos);
      yPos += 10;

      // Day date
      const date = calculateDayDate(currentTrip.startDate, dayIndex);
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(formatDate(date), margin + 5, yPos);
      yPos += 5;

      // Day budget
      const dayBudget = calculateDayBudget(day);
      if (dayBudget > 0) {
        const currency = currentTrip?.currency || 'USD';
        doc.setFontSize(9);
        doc.text(`Budget: ${formatCurrency(dayBudget, currency)}`, pageWidth - margin - 40, yPos);
      }

      yPos += 10;

      // Activities
      if (day.activities && day.activities.length > 0) {
        day.activities.forEach((activity, actIndex) => {
          checkPageBreak(25);

          // Activity number and time
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(`${actIndex + 1}. ${activity.time || ''} - ${activity.name}`, margin + 5, yPos);
          yPos += 7;

          // Activity details
          if (activity.details || activity.description) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            const detailsHeight = addWrappedText(
              activity.details || activity.description,
              margin + 10,
              yPos,
              contentWidth - 15,
              9
            );
            yPos += detailsHeight + 3;
          }

          // Activity metadata
          const metadata = [];
          if (activity.duration) metadata.push(`Duration: ${activity.duration}`);
          if (activity.location && activity.location.address) metadata.push(`Address: ${activity.location.address}`);
          if (activity.cost) {
            const currency = currentTrip?.currency || 'USD';
            metadata.push(`Cost: ${formatCurrency(activity.cost, currency)}`);
          }

          if (metadata.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            metadata.forEach(meta => {
              checkPageBreak(6);
              doc.text(`  ${meta}`, margin + 10, yPos);
              yPos += 5;
            });
          }

          yPos += 5;
        });
      }

      yPos += 5;
    });

    // Footer on last page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated by Wahgola • Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const filename = `${currentTrip.name || 'Trip'} - Itinerary.pdf`.replace(/[^a-z0-9 -]/gi, '');
    doc.save(filename);

    showToast('PDF exported successfully!', 2000, 'success');

  } catch (error) {
    console.error('[PDF Export] Error:', error);
    showToast('Failed to export PDF', 3000, 'error');
  }
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [37, 99, 235]; // Default blue
}

/**
 * ============================================
 * DROPDOWN MENU FUNCTIONALITY
 * ============================================
 */

/**
 * Toggle the trip menu dropdown
 */
function toggleTripMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('tripMenu');

  if (!menu) return;

  const isVisible = menu.style.display === 'block';

  // Close menu if open, open if closed
  if (isVisible) {
    menu.style.display = 'none';
  } else {
    menu.style.display = 'block';
  }
}

/**
 * Close menu when clicking outside
 */
document.addEventListener('click', (event) => {
  const menu = document.getElementById('tripMenu');
  const menuBtn = document.getElementById('tripMenuBtn');

  if (!menu || !menuBtn) return;

  // Close if clicking outside menu and button
  if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
    menu.style.display = 'none';
  }
});

/**
 * Share trip (copy URL to clipboard)
 */
function shareTrip() {
  const url = window.location.href;

  // Try to use the modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Trip link copied to clipboard!', 2000, 'success');
    }).catch(() => {
      fallbackCopyToClipboard(url);
    });
  } else {
    fallbackCopyToClipboard(url);
  }
}

/**
 * Fallback copy to clipboard method
 */
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
    showToast('Trip link copied to clipboard!', 2000, 'success');
  } catch (err) {
    showToast('Failed to copy link', 2000, 'error');
  }

  document.body.removeChild(textArea);
}

/**
 * Duplicate the current trip
 */
function duplicateTrip() {
  const menu = document.getElementById('tripMenu');
  if (menu) menu.style.display = 'none';

  if (!currentTrip || !currentTripId) {
    showToast('No trip to duplicate', 2000, 'error');
    return;
  }

  // Create a copy with new ID and modified name
  const duplicatedTrip = {
    ...currentTrip,
    id: crypto.randomUUID(),
    name: `${currentTrip.name} (Copy)`,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };

  // Save the duplicated trip
  tripManager.saveTrip(duplicatedTrip);

  showToast('Trip duplicated successfully!', 2000, 'success');

  // Redirect to dashboard after a short delay
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

/**
 * Delete the current trip
 */
function deleteTrip() {
  const menu = document.getElementById('tripMenu');
  if (menu) menu.style.display = 'none';

  if (!currentTripId) {
    showToast('No trip to delete', 2000, 'error');
    return;
  }

  // Confirm deletion
  const tripName = currentTrip?.name || 'this trip';
  const confirmed = confirm(`Are you sure you want to delete "${tripName}"? This action cannot be undone.`);

  if (!confirmed) return;

  // Delete trip (async - deletes from both local and cloud)
  tripManager.deleteTrip(currentTripId).then(() => {
    showToast('Trip deleted from local and cloud', 2000, 'success');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  }).catch(error => {
    console.error('Delete error:', error);
    showToast('Trip deleted (cloud delete may have failed)', 2000, 'warning');

    // Redirect anyway
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  });
}

/**
 * Print the trip itinerary
 */
function printTrip() {
  const menu = document.getElementById('tripMenu');
  if (menu) menu.style.display = 'none';

  window.print();
}

/**
 * ============================================
 * SYNC STATUS UI
 * ============================================
 */

/**
 * Initialize authentication and sync UI
 */
function initializeAuth() {
  // Wait for auth service to initialize
  if (typeof authService === 'undefined') {
    console.log('Auth service not available - running in offline mode');
    return;
  }

  authService.init().then(async () => {
    const isAuth = await authService.isAuthenticated();
    if (isAuth) {
      updateSyncUI('synced');
    }

    // Listen for sync changes
    if (typeof syncService !== 'undefined') {
      syncService.onSyncComplete((result) => {
        console.log('Sync completed:', result);
        if (result.success) {
          updateSyncUI('synced');
          // Reload trip if it was synced
          if (currentTrip && currentTrip.id) {
            const updatedTrip = tripManager.getTrip(currentTrip.id);
            if (updatedTrip) {
              currentTrip = updatedTrip;
              renderTrip();
            }
          }
        } else {
          updateSyncUI('error');
        }
      });
    }
  });
}

/**
 * Update sync UI indicator
 */
function updateSyncUI(status) {
  const syncStatus = document.getElementById('syncStatus');
  const syncText = document.getElementById('syncText');

  if (!syncStatus) return;

  syncStatus.style.display = 'flex';
  syncStatus.className = 'sync-status';

  switch (status) {
    case 'syncing':
      syncStatus.classList.add('syncing');
      syncText.textContent = 'Syncing...';
      break;
    case 'synced':
      if (typeof syncService !== 'undefined') {
        const lastSync = syncService.getSyncStatus().lastSync;
        if (lastSync) {
          const minutes = Math.floor((Date.now() - lastSync.getTime()) / 60000);
          syncText.textContent = minutes === 0 ? 'Just synced' : `Synced ${minutes}m ago`;
        } else {
          syncText.textContent = 'Synced';
        }
      } else {
        syncText.textContent = 'Synced';
      }
      break;
    case 'error':
      syncStatus.classList.add('error');
      syncText.textContent = 'Sync failed';
      break;
  }

  // Update tooltip details
  updateSyncTooltip();
}

/**
 * Update sync tooltip with detailed information
 */
function updateSyncTooltip() {
  if (typeof syncService === 'undefined') return;

  const syncStatus = syncService.getSyncStatus();

  // Last sync time
  const lastSyncEl = document.getElementById('lastSyncTime');
  if (lastSyncEl) {
    if (syncStatus.lastSync) {
      lastSyncEl.textContent = formatRelativeTime(syncStatus.lastSync);
      lastSyncEl.title = syncStatus.lastSync.toLocaleString();
    } else {
      lastSyncEl.textContent = 'Never';
    }
  }

  // Status
  const statusValueEl = document.getElementById('syncStatusValue');
  if (statusValueEl) {
    if (syncStatus.syncing) {
      statusValueEl.textContent = 'Syncing...';
      statusValueEl.style.color = 'var(--color-primary)';
    } else if (syncStatus.authenticated) {
      statusValueEl.textContent = 'Active';
      statusValueEl.style.color = 'var(--color-success)';
    } else {
      statusValueEl.textContent = 'Offline';
      statusValueEl.style.color = 'var(--color-text-tertiary)';
    }
  }

  // Device ID
  const deviceIdEl = document.getElementById('deviceId');
  if (deviceIdEl) {
    deviceIdEl.textContent = syncStatus.deviceId || '-';
    deviceIdEl.title = syncStatus.deviceId;
  }
}

/**
 * Format relative time (e.g., "2 minutes ago", "Just now")
 */
function formatRelativeTime(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
}

/**
 * Show sync details tooltip
 */
function showSyncDetails() {
  const tooltip = document.getElementById('syncTooltip');
  if (!tooltip) return;

  const isVisible = tooltip.style.display === 'block';

  // Close if already open
  if (isVisible) {
    tooltip.style.display = 'none';
    return;
  }

  // Update and show
  updateSyncTooltip();
  tooltip.style.display = 'block';

  // Close on outside click
  setTimeout(() => {
    const closeOnOutsideClick = (e) => {
      const syncStatus = document.getElementById('syncStatus');
      if (!syncStatus.contains(e.target)) {
        tooltip.style.display = 'none';
        document.removeEventListener('click', closeOnOutsideClick);
      }
    };
    document.addEventListener('click', closeOnOutsideClick);
  }, 100);
}

/**
 * Manually trigger sync
 */
async function manualSync() {
  if (typeof syncService === 'undefined') {
    showToast('Sync service not available', 3000, 'error');
    return;
  }

  const btn = document.querySelector('.btn-sync-now');
  if (!btn) return;

  // Disable button
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>
    Syncing...
  `;

  try {
    updateSyncUI('syncing');
    await syncService.syncAll();
    showToast('Sync completed successfully!', 2000, 'success');
  } catch (error) {
    console.error('Manual sync error:', error);
    showToast('Sync failed: ' + error.message, 3000, 'error');
  } finally {
    // Re-enable button
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
      </svg>
      Sync Now
    `;
  }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeAuth();

  // Update sync UI every minute to keep "X minutes ago" fresh
  setInterval(() => {
    if (typeof syncService !== 'undefined' && syncService.getSyncStatus().authenticated) {
      updateSyncUI('synced');
    }
  }, 60000); // Every 60 seconds
});

/**
 * ============================================
 * TRIP CHECKLIST FUNCTIONALITY
 * ============================================
 */

/**
 * Build and display trip checklist from activities
 */
function buildTripChecklist() {
  if (!currentTrip || !currentTrip.days) return;

  const checklist = {
    eat: [],
    shop: [],
    play: [],
    stay: []
  };

  // Categorize activities
  currentTrip.days.forEach((day, dayIndex) => {
    if (!day.activities) return;

    day.activities.forEach(activity => {
      const type = activity.location?.type?.toLowerCase() || '';
      const item = {
        name: activity.name,
        day: dayIndex + 1,
        completed: activity.checklistCompleted || false,
        activityId: activity.id || `${dayIndex}-${activity.name}`
      };

      // Categorize based on activity type
      if (type.includes('food') || type.includes('restaurant') || type.includes('cafe') || type.includes('bar')) {
        checklist.eat.push(item);
      } else if (type.includes('shop') || type.includes('market') || type.includes('mall')) {
        checklist.shop.push(item);
      } else if (type.includes('hotel') || type.includes('accommodation') || type.includes('stay')) {
        checklist.stay.push(item);
      } else if (type.includes('temple') || type.includes('attraction') || type.includes('park') || type.includes('museum') || type.includes('activity')) {
        checklist.play.push(item);
      } else {
        // Default to play/activities if uncertain
        checklist.play.push(item);
      }
    });
  });

  // Display checklist
  displayChecklist(checklist);
}

/**
 * Display checklist in UI
 */
function displayChecklist(checklist) {
  const checklistCard = document.getElementById('tripChecklistCard');
  if (!checklistCard) return;

  // Only show if there are items
  const totalItems = checklist.eat.length + checklist.shop.length + checklist.play.length + checklist.stay.length;
  if (totalItems === 0) {
    checklistCard.style.display = 'none';
    return;
  }

  checklistCard.style.display = 'block';

  // Update each category
  updateChecklistCategory('eat', checklist.eat, '🍽️');
  updateChecklistCategory('shop', checklist.shop, '🛍️');
  updateChecklistCategory('play', checklist.play, '🎮');
  updateChecklistCategory('stay', checklist.stay, '🏨');
}

/**
 * Update a single checklist category
 */
function updateChecklistCategory(categoryId, items, icon) {
  const countEl = document.getElementById(`${categoryId}Count`);
  const listEl = document.getElementById(`${categoryId}List`);

  if (!countEl || !listEl) return;

  // Update count
  const completedCount = items.filter(item => item.completed).length;
  countEl.textContent = `${completedCount}/${items.length}`;

  // Update list
  if (items.length === 0) {
    listEl.innerHTML = '<p class="checklist-empty">No items yet</p>';
    return;
  }

  listEl.innerHTML = items.map(item => `
    <div class="checklist-item ${item.completed ? 'completed' : ''}">
      <label class="checklist-item-label">
        <input
          type="checkbox"
          ${item.completed ? 'checked' : ''}
          onchange="toggleChecklistItem('${categoryId}', '${escapeHtml(item.activityId)}')"
        >
        <span class="checklist-item-text">${escapeHtml(item.name)}</span>
        <span class="checklist-item-day">Day ${item.day}</span>
      </label>
    </div>
  `).join('');
}

/**
 * Toggle checklist item completion
 */
function toggleChecklistItem(categoryId, activityId) {
  if (!currentTrip || !currentTrip.days) return;

  // Find and update activity
  let found = false;
  currentTrip.days.forEach(day => {
    if (!day.activities) return;
    day.activities.forEach(activity => {
      const itemId = activity.id || `${currentTrip.days.indexOf(day)}-${activity.name}`;
      if (itemId === activityId) {
        activity.checklistCompleted = !activity.checklistCompleted;
        found = true;
      }
    });
  });

  if (found) {
    // Save to trip manager
    tripManager.updateTrip(currentTripId, currentTrip);

    // Rebuild checklist to reflect changes
    buildTripChecklist();
  }
}

/**
 * Toggle checklist expand/collapse
 */
function toggleChecklistExpand() {
  const content = document.getElementById('checklistContent');
  const btn = document.getElementById('checklistToggleBtn');

  if (!content || !btn) return;

  const isCollapsed = content.style.display === 'none';

  if (isCollapsed) {
    content.style.display = 'block';
    btn.style.transform = 'rotate(0deg)';
  } else {
    content.style.display = 'none';
    btn.style.transform = 'rotate(-90deg)';
  }
}

// Build checklist on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    buildTripChecklist();
  }, 500);
});
