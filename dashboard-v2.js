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
  window.location.href = `trip-planner-v2.html?trip=${tripId}`;
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
 * Generate trip with AI
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

  const loadingMessages = [
    'Analyzing destinations and activities...',
    'Finding the best places to visit...',
    'Creating day-by-day itinerary...',
    'Adding GPS locations and details...'
  ];

  let messageIndex = 0;
  const messageInterval = setInterval(() => {
    document.getElementById('loadingMessage').textContent = loadingMessages[messageIndex];
    messageIndex = (messageIndex + 1) % loadingMessages.length;
  }, 2000);

  try {
    const response = await fetch('/api/generate-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.userMessage || error.error || 'Failed to generate trip');
    }

    const tripData = await response.json();

    clearInterval(messageInterval);

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
    clearInterval(messageInterval);
    console.error('AI generation error:', error);

    document.querySelector('.ai-form').style.display = 'block';
    document.getElementById('loadingState').style.display = 'none';

    alert(error.message || 'Failed to generate trip. Please try again.');
  }
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

  authService.init().then(() => {
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
      syncService.onSyncComplete = (result) => {
        if (result.success) {
          updateSyncUI('synced');
          loadTrips(); // Reload trips after sync
        } else {
          updateSyncUI('error');
        }
      };
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
