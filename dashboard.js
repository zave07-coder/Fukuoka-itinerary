/**
 * Dashboard V2 - Modern trip management interface
 * Handles all dashboard interactions, modals, and trip operations
 */

// Initialize trip manager
const tripManager = new TripManager();

// State
let currentTrips = [];
let filteredTrips = [];
let searchQuery = '';
let sortBy = 'recent';

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTrips();
  setupEventListeners();
  updateCharCount();
  initializeAuth();
});

/**
 * Load and render all trips
 */
function loadTrips() {
  currentTrips = tripManager.getAllTrips();
  filteredTrips = [...currentTrips];

  applyFilters();
  renderTrips();
  updateTripCount();

  // Show hero if no trips
  if (currentTrips.length === 0) {
    showHero();
  } else {
    hideHero();
  }
}

/**
 * Render trips to the grid
 */
function renderTrips() {
  const grid = document.getElementById('tripsGrid');

  if (filteredTrips.length === 0) {
    grid.innerHTML = '<p class="empty-message">No trips found. Try adjusting your search.</p>';
    return;
  }

  grid.innerHTML = filteredTrips.map(trip => createTripCard(trip)).join('');
}

/**
 * Create HTML for a trip card
 */
function createTripCard(trip) {
  const duration = calculateDuration(trip.startDate, trip.endDate);
  const coverImage = trip.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
  const totalBudget = calculateTripBudget(trip);
  const currency = trip.currency || 'USD';

  return `
    <div class="trip-card" onclick="openTrip('${trip.id}')">
      <div class="trip-card-image-wrapper">
        <img src="${coverImage}" alt="${trip.name}" class="trip-card-image">
        <div class="trip-card-actions">
          <button class="card-action-btn" onclick="event.stopPropagation(); editTripName('${trip.id}')" title="Edit name">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="card-action-btn" onclick="event.stopPropagation(); duplicateTrip('${trip.id}')" title="Duplicate">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="card-action-btn" onclick="event.stopPropagation(); confirmDeleteTrip('${trip.id}')" title="Delete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="trip-card-content">
        <div class="trip-card-header">
          <h3 class="trip-card-title">${escapeHtml(trip.name)}</h3>
          <div class="trip-card-destination">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${escapeHtml(trip.destination || 'No destination')}
          </div>
        </div>
        <div class="trip-card-meta">
          <div class="trip-card-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${formatDateRange(trip.startDate, trip.endDate)}
          </div>
          <div class="trip-card-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${duration}
          </div>
          ${totalBudget > 0 ? `
            <div class="trip-card-meta-item trip-card-budget">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v12M15 9H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H9"></path>
              </svg>
              ${formatCurrency(totalBudget, currency)}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // New trip button
  document.getElementById('newTripBtn')?.addEventListener('click', openMethodModal);

  // Search
  document.getElementById('searchToggle')?.addEventListener('click', toggleSearch);
  document.getElementById('searchInput')?.addEventListener('input', handleSearch);

  // Sort
  document.getElementById('sortSelect')?.addEventListener('change', handleSort);

  // AI prompt char count
  const aiPrompt = document.getElementById('aiPrompt');
  if (aiPrompt) {
    aiPrompt.addEventListener('input', updateCharCount);
  }

  // Quick option tags
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', handleTagClick);
  });
}

/**
 * Toggle search bar
 */
function toggleSearch() {
  const searchBar = document.getElementById('searchBar');
  const isVisible = searchBar.style.display !== 'none';

  if (isVisible) {
    searchBar.style.display = 'none';
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    applyFilters();
  } else {
    searchBar.style.display = 'block';
    document.getElementById('searchInput').focus();
  }
}

function closeSearch() {
  toggleSearch();
}

/**
 * Handle search input
 */
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase();
  applyFilters();
}

/**
 * Handle sort change
 */
function handleSort(e) {
  sortBy = e.target.value;
  applyFilters();
}

/**
 * Apply filters and sort
 */
function applyFilters() {
  // Filter by search
  filteredTrips = currentTrips.filter(trip => {
    if (!searchQuery) return true;

    const searchableText = `${trip.name} ${trip.destination}`.toLowerCase();
    return searchableText.includes(searchQuery);
  });

  // Sort
  filteredTrips.sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'upcoming':
        return new Date(a.startDate) - new Date(b.startDate);
      case 'date':
        return new Date(a.startDate) - new Date(b.startDate);
      default:
        return 0;
    }
  });

  renderTrips();
}

/**
 * Update trip count display
 */
function updateTripCount() {
  const countEl = document.getElementById('tripCount');
  if (countEl) {
    const count = currentTrips.length;
    countEl.textContent = `${count} ${count === 1 ? 'trip' : 'trips'}`;
  }
}

/**
 * Show/hide hero section
 */
function showHero() {
  const hero = document.getElementById('heroSection');
  const main = document.getElementById('mainContent');
  if (hero) hero.style.display = 'flex';
  if (main) main.style.display = 'none';
}

function hideHero() {
  const hero = document.getElementById('heroSection');
  const main = document.getElementById('mainContent');
  if (hero) hero.style.display = 'none';
  if (main) main.style.display = 'block';
}

/**
 * Open trip viewer
 */
function openTrip(tripId) {
  window.location.href = `trip-planner.html?trip=${tripId}`;
}

/**
 * Modal functions
 */
function openMethodModal() {
  document.getElementById('methodModalOverlay').style.display = 'flex';
}

function closeMethodModal() {
  document.getElementById('methodModalOverlay').style.display = 'none';
}

function openAIModal() {
  closeMethodModal();
  document.getElementById('aiModalOverlay').style.display = 'flex';
}

function closeAIModal() {
  document.getElementById('aiModalOverlay').style.display = 'none';
}

function backToMethodModal() {
  closeAIModal();
  openMethodModal();
}

/**
 * Start blank trip
 */
function startBlankTrip() {
  const trip = tripManager.createTrip({
    name: 'Untitled Trip',
    destination: '',
    startDate: '',
    endDate: '',
    days: []
  });

  closeMethodModal();
  openTrip(trip.id);
}

/**
 * Generate trip with AI (with streaming support)
 */
async function generateTrip() {
  const prompt = document.getElementById('aiPrompt').value.trim();

  if (!prompt) {
    alert('Please describe your trip');
    return;
  }

  // Show loading
  document.querySelector('.ai-form').style.display = 'none';
  document.getElementById('loadingState').style.display = 'block';

  const loadingMessageEl = document.getElementById('loadingMessage');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  loadingMessageEl.textContent = 'Connecting to AI...';

  // Initialize progress at 10% to show immediate activity
  if (progressBar) progressBar.style.width = '10%';
  if (progressText) progressText.textContent = '10%';

  try {
    console.log('🚀 Starting AI trip generation with streaming...');
    const response = await fetch('/api/generate-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, stream: true })
    });

    console.log('📡 Response received:', response.status, response.headers.get('Content-Type'));

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.userMessage || error.error || 'Failed to generate trip');
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let tripData = null;
    let eventCount = 0;

    console.log('📖 Starting to read stream...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log(`✅ Stream complete. Received ${eventCount} events`);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            eventCount++;

            if (event.type === 'progress') {
              // Use percentage from backend (already ensures 10-95% range)
              // Fallback calculation if percentage not provided
              let percentage = event.percentage !== undefined
                ? event.percentage
                : Math.min(95, Math.max(10, Math.floor(10 + (event.content.length / 5000) * 80)));

              // Update progress bar and text
              if (progressBar) {
                progressBar.style.width = `${percentage}%`;
              }
              if (progressText) {
                progressText.textContent = `${percentage}%`;
              }

              // Debug logging (every 20 events to avoid spam)
              if (eventCount % 20 === 0) {
                console.log(`📊 Progress: ${percentage}% (content: ${event.content?.length} chars)`);
              }

              // Update step indicators based on percentage
              const steps = document.querySelectorAll('.progress-step');
              if (steps.length > 0) {
                steps.forEach((step, index) => {
                  if (percentage >= (index + 1) * 25) {
                    step.classList.add('active');
                  }
                });
              }

              // Show preview of content being generated
              const preview = event.content.substring(0, 200);
              const lines = preview.split('\n').filter(l => l.trim());
              const firstLine = lines[0] || 'Generating...';
              loadingMessageEl.textContent = `✨ ${firstLine.substring(0, 80)}...`;

              if (eventCount % 10 === 0) {
                console.log(`📝 Progress event ${eventCount}: ${event.content.length} chars, ${percentage}%`);
              }
            } else if (event.type === 'complete') {
              console.log('✅ Received completion event');
              tripData = event.data;

              // Update to 100% complete
              if (progressBar) progressBar.style.width = '100%';
              if (progressText) progressText.textContent = '100%';
              loadingMessageEl.textContent = '✅ Trip generated successfully!';

              // Break out immediately - we have the data
              reader.cancel();
              break;
            } else if (event.type === 'error') {
              console.error('❌ Received error event:', event.error);
              throw new Error(event.error);
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse SSE event:', e, 'Line:', line);
          }
        }
      }

      // If we got the complete event, exit the outer loop too
      if (tripData) {
        console.log('🎉 Breaking out of stream loop with trip data');
        break;
      }
    }

    if (!tripData) {
      console.error('❌ No trip data received after stream completed');
      throw new Error('No trip data received');
    }

    console.log('✅ Trip data received:', tripData.name);

    // Create trip
    const trip = tripManager.createTrip(tripData);

    // Close modal and open trip
    closeAIModal();
    document.querySelector('.ai-form').style.display = 'block';
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('aiPrompt').value = '';

    // Redirect to trip
    openTrip(trip.id);

  } catch (error) {
    console.error('AI generation error:', error);

    document.querySelector('.ai-form').style.display = 'block';
    document.getElementById('loadingState').style.display = 'none';

    // Provide helpful error messages
    let errorMessage = error.message || 'Failed to generate trip. Please try again.';

    if (errorMessage.includes('timeout')) {
      errorMessage += '\n\nTip: Try describing a shorter trip (e.g., 3-5 days) or be more specific about your destination.';
    }

    alert(errorMessage);
  }
}

/**
 * Handle quick tag button clicks
 */
function handleTagClick(e) {
  const btn = e.currentTarget;
  const tag = btn.dataset.tag;
  const textarea = document.getElementById('aiPrompt');

  // Toggle active state
  btn.classList.toggle('active');

  // Add tag template to textarea based on type
  let template = '';
  switch(tag) {
    case 'destination':
      template = '\nDestination: ';
      break;
    case 'duration':
      template = '\nDuration: ';
      break;
    case 'style':
      template = '\nTravel style: ';
      break;
  }

  if (btn.classList.contains('active')) {
    textarea.value += template;
    textarea.focus();
    // Position cursor at end of added template
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
  }

  updateCharCount();
}

/**
 * Update character count
 */
function updateCharCount() {
  const textarea = document.getElementById('aiPrompt');
  const counter = document.querySelector('.char-count');
  if (textarea && counter) {
    counter.textContent = `${textarea.value.length} / 2000`;
  }
}

/**
 * Edit trip name
 */
function editTripName(tripId) {
  const trip = tripManager.getTrip(tripId);
  if (!trip) return;

  const newName = prompt('Enter new trip name:', trip.name);
  if (newName && newName.trim() !== '') {
    tripManager.updateTrip(tripId, { name: newName.trim() });
    loadTrips();
  }
}

/**
 * Duplicate trip
 */
function duplicateTrip(tripId) {
  const trip = tripManager.getTrip(tripId);
  if (!trip) return;

  const duplicate = tripManager.createTrip({
    ...trip,
    name: `${trip.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  loadTrips();
  showToast(`Trip duplicated: ${duplicate.name}`);
}

/**
 * Confirm and delete trip
 */
function confirmDeleteTrip(tripId) {
  const trip = tripManager.getTrip(tripId);
  if (!trip) return;

  if (confirm(`Delete "${trip.name}"?\n\nThis cannot be undone.`)) {
    tripManager.deleteTrip(tripId);
    loadTrips();
    showToast('Trip deleted');
  }
}

/**
 * Utility functions
 */
function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return 'No dates';

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

function formatDateRange(startDate, endDate) {
  if (!startDate) return 'No dates';

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  if (end) {
    return `${formatDate(start)}-${formatDate(end)}, ${start.getFullYear()}`;
  } else {
    return formatDate(start);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  // Simple toast - could be enhanced
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    z-index: 9999;
    animation: slideUp 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Authentication and Sync Integration
 */
function initializeAuth() {
  // Wait for auth service to initialize
  if (typeof authService === 'undefined') {
    console.log('Auth service not available - running in offline mode');
    document.getElementById('signInBtn').style.display = 'block';
    return;
  }

  authService.init().then(async () => {
    // Verify session is still valid
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      console.log('No valid session found, user needs to log in again');
    }
    updateAuthUI();

    // Listen for auth changes
    authService.onAuthStateChange((user) => {
      updateAuthUI();
      if (user) {
        // User just logged in - sync trips
        syncService.migrateLocalTripsToCloud();
      }
    });

    // Listen for sync changes
    if (typeof syncService !== 'undefined') {
      syncService.onSyncComplete((result) => {
        console.log('Sync completed:', result);
        if (result.success) {
          updateSyncUI('synced');
          console.log('Reloading trips after sync...');
          loadTrips(); // Reload trips after sync
        } else {
          updateSyncUI('error');
          console.error('Sync error:', result.error);
        }
      });

      // Also reload trips immediately if already synced (handles page loads after login)
      const syncStatus = syncService.getSyncStatus();
      if (syncStatus.authenticated && syncStatus.lastSync) {
        console.log('Loading trips after auth initialization');
        setTimeout(() => loadTrips(), 500); // Give time for storage to settle
      }
    }
  });
}

/**
 * Update auth UI based on user state
 */
function updateAuthUI() {
  const user = authService.getCurrentUser();
  const userMenu = document.getElementById('userMenu');
  const signInBtn = document.getElementById('signInBtn');
  const syncStatus = document.getElementById('syncStatus');

  if (user) {
    // User is signed in
    userMenu.style.display = 'block';
    signInBtn.style.display = 'none';
    syncStatus.style.display = 'flex';

    // Update user info
    const displayName = user.user_metadata?.full_name || user.email;
    const initials = displayName.charAt(0).toUpperCase();

    document.getElementById('userInitials').textContent = initials;
    document.getElementById('userName').textContent = displayName;
    document.getElementById('userEmail').textContent = user.email;

    // Show sync status
    updateSyncUI('synced');
  } else {
    // User is signed out
    userMenu.style.display = 'none';
    signInBtn.style.display = 'block';
    syncStatus.style.display = 'none';
  }
}

/**
 * Update sync UI indicator
 */
function updateSyncUI(status) {
  const syncStatus = document.getElementById('syncStatus');
  const syncText = document.getElementById('syncText');

  if (!syncStatus) return;

  syncStatus.className = 'sync-status';

  switch (status) {
    case 'syncing':
      syncStatus.classList.add('syncing');
      syncText.textContent = 'Syncing...';
      break;
    case 'synced':
      const lastSync = syncService.getSyncStatus().lastSync;
      if (lastSync) {
        const minutes = Math.floor((Date.now() - lastSync.getTime()) / 60000);
        syncText.textContent = minutes === 0 ? 'Just synced' : `Synced ${minutes}m ago`;
      } else {
        syncText.textContent = 'Synced';
      }
      break;
    case 'error':
      syncStatus.classList.add('error');
      syncText.textContent = 'Sync failed';
      break;
  }
}

/**
 * Toggle user dropdown menu
 */
function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

/**
 * Sign out user
 */
async function signOut() {
  if (confirm('Sign out? Your trips will still be saved locally.')) {
    await authService.signOut();
    updateAuthUI();
    showToast('Signed out successfully');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('userMenu');
  const dropdown = document.getElementById('userDropdown');
  if (dropdown && userMenu && !userMenu.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

/**
 * Save specific trip to cloud
 */
async function saveTripToCloud(tripId) {
  try {
    const authToken = authService.getToken();

    if (!authToken) {
      alert('Please sign in to save trips to cloud');
      return;
    }

    showToast('Saving to cloud...');

    await tripManager.saveTripToCloud(tripId, authToken);

    showToast('Trip saved to cloud successfully!');
    loadTrips(); // Refresh to show sync status
  } catch (error) {
    console.error('Save to cloud error:', error);
    alert('Failed to save trip to cloud: ' + error.message);
  }
}

/**
 * Sync all trips with cloud
 */
async function syncAllTrips() {
  try {
    const authToken = authService.getToken();

    if (!authToken) {
      alert('Please sign in to sync trips');
      return;
    }

    showToast('Syncing trips...');

    const results = await tripManager.syncWithCloud(authToken);

    showToast(`Sync complete! Uploaded: ${results.uploaded}, Downloaded: ${results.downloaded}`);
    loadTrips(); // Refresh dashboard
  } catch (error) {
    console.error('Sync error:', error);
    alert('Failed to sync trips: ' + error.message);
  }
}

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
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
 * Calculate trip total budget
 */
function calculateTripBudget(trip) {
  if (!trip || !trip.days) return 0;

  return trip.days.reduce((total, day) => {
    if (!day || !day.activities) return total;

    const dayTotal = day.activities.reduce((daySum, activity) => {
      const cost = parseFloat(activity.cost) || 0;
      return daySum + cost;
    }, 0);

    return total + dayTotal;
  }, 0);
}
