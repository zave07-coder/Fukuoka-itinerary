/**
 * Dashboard Logic - WayWeave
 * Handles trip grid rendering, user interactions, and CRUD operations
 */

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
});

let tripManager;
let currentDeleteTripId = null;

/**
 * Initialize dashboard
 */
function initializeDashboard() {
  tripManager = new TripManager();

  // Check storage and show warning if needed
  checkStorageUsage();

  // Render initial trip grid
  renderDashboard();

  // Set up event listeners
  setupEventListeners();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Create trip button
  document.getElementById('createTripBtn').addEventListener('click', openCreateTripModal);

  // Create trip form submission
  document.getElementById('createTripForm').addEventListener('submit', handleCreateTrip);

  // Search input
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', debounce(handleSearchAndSort, 300));

  // Sort select
  document.getElementById('sortSelect').addEventListener('change', handleSearchAndSort);

  // Modal overlay clicks
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCreateTripModal();
      closeDeleteModal();
    }
  });

  // Date validation
  const startDateInput = document.getElementById('tripStartDate');
  const endDateInput = document.getElementById('tripEndDate');

  startDateInput.addEventListener('change', () => {
    endDateInput.min = startDateInput.value;
  });
}

/**
 * Render the entire dashboard
 */
function renderDashboard() {
  const trips = tripManager.getAllTrips();

  const tripGrid = document.getElementById('tripGrid');
  const emptyState = document.getElementById('emptyState');
  const dashboardControls = document.getElementById('dashboardControls');

  if (trips.length === 0) {
    // Show empty state
    tripGrid.style.display = 'none';
    emptyState.style.display = 'flex';
    dashboardControls.style.display = 'none';
  } else {
    // Show trip grid
    tripGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    dashboardControls.style.display = trips.length > 3 ? 'flex' : 'none';

    // Render trips
    tripGrid.innerHTML = trips.map(trip => renderTripCard(trip)).join('');

    // Attach event listeners to cards
    attachCardEventListeners();
  }
}

/**
 * Render a single trip card
 * @param {Object} trip - Trip object
 * @returns {string} HTML string
 */
function renderTripCard(trip) {
  const duration = calculateDuration(trip.startDate, trip.endDate);
  const dayCount = trip.days?.length || 0;
  const formattedDate = formatDateRange(trip.startDate, trip.endDate);

  return `
    <div class="trip-card" data-trip-id="${trip.id}">
      <!-- Actions overlay -->
      <div class="trip-card-actions" onclick="event.stopPropagation()">
        <button
          class="trip-action-btn duplicate-btn"
          onclick="handleDuplicateTrip('${trip.id}')"
          aria-label="Duplicate trip"
          title="Duplicate"
        >
          📋
        </button>
        <button
          class="trip-action-btn delete-btn"
          onclick="handleDeleteTrip('${trip.id}')"
          aria-label="Delete trip"
          title="Delete"
        >
          🗑️
        </button>
      </div>

      <!-- Card image -->
      <div class="trip-card-image">
        <img src="${trip.coverImage || ''}" alt="${trip.name}" onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'">
      </div>

      <!-- Card content -->
      <div class="trip-card-content">
        <h3
          class="trip-card-title"
          contenteditable="false"
          data-trip-id="${trip.id}"
          onclick="event.stopPropagation(); enableTitleEdit(this, '${trip.id}')"
        >${escapeHtml(trip.name)}</h3>

        <div class="trip-card-destination">${escapeHtml(trip.destination)}</div>

        <div class="trip-card-meta">
          <span class="trip-card-badge">📅 ${formattedDate}</span>
          ${dayCount > 0 ? `<span class="trip-card-badge">🗓️ ${dayCount} day${dayCount !== 1 ? 's' : ''}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach event listeners to all trip cards
 */
function attachCardEventListeners() {
  const cards = document.querySelectorAll('.trip-card');

  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on action buttons or title
      if (
        e.target.closest('.trip-card-actions') ||
        e.target.classList.contains('trip-card-title')
      ) {
        return;
      }

      const tripId = card.getAttribute('data-trip-id');
      openTrip(tripId);
    });
  });
}

/**
 * Open trip viewer for a specific trip
 * @param {string} tripId - Trip ID
 */
function openTrip(tripId) {
  window.location.href = `trip.html?trip=${tripId}`;
}

/**
 * Enable inline editing for trip title
 * @param {HTMLElement} element - Title element
 * @param {string} tripId - Trip ID
 */
function enableTitleEdit(element, tripId) {
  const originalText = element.textContent.trim();

  // Enable contenteditable
  element.contentEditable = 'true';
  element.classList.add('editing');
  element.focus();

  // Select all text
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  // Save on blur or Enter
  const saveTitle = () => {
    const newText = element.textContent.trim();

    if (newText && newText !== originalText) {
      tripManager.updateTrip(tripId, { name: newText });
      showToast('Trip name updated ✓');
    } else if (!newText) {
      element.textContent = originalText;
    }

    element.contentEditable = 'false';
    element.classList.remove('editing');
  };

  element.addEventListener('blur', saveTitle, { once: true });

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      element.blur();
    } else if (e.key === 'Escape') {
      element.textContent = originalText;
      element.blur();
    }
  }, { once: true });
}

/**
 * Open create trip modal
 */
function openCreateTripModal() {
  const modal = document.getElementById('createTripModal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');

  // Set default start date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('tripStartDate').value = today;

  // Focus first input
  setTimeout(() => {
    document.getElementById('tripName').focus();
  }, 100);
}

/**
 * Close create trip modal
 */
function closeCreateTripModal() {
  const modal = document.getElementById('createTripModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');

  // Reset form
  document.getElementById('createTripForm').reset();
}

/**
 * Handle create trip form submission
 * @param {Event} e - Form submit event
 */
function handleCreateTrip(e) {
  e.preventDefault();

  const formData = new FormData(e.target);

  const tripData = {
    name: formData.get('tripName'),
    destination: formData.get('tripDestination'),
    startDate: formData.get('tripStartDate'),
    endDate: formData.get('tripEndDate'),
    coverImage: formData.get('tripCoverImage') || undefined,
    days: [] // Empty itinerary - user will build it in trip viewer
  };

  // Validate dates
  if (new Date(tripData.endDate) < new Date(tripData.startDate)) {
    showToast('End date must be after start date ⚠️');
    return;
  }

  try {
    const newTrip = tripManager.createTrip(tripData);
    showToast('Trip created successfully! ✓');

    closeCreateTripModal();

    // Redirect to trip viewer to start building itinerary
    setTimeout(() => {
      window.location.href = `trip.html?trip=${newTrip.id}`;
    }, 500);
  } catch (error) {
    console.error('Error creating trip:', error);

    if (error.message.includes('quota')) {
      showToast('Storage full! Delete some trips first. ⚠️');
    } else {
      showToast('Error creating trip. Please try again. ⚠️');
    }
  }
}

/**
 * Handle duplicate trip
 * @param {string} tripId - Trip ID to duplicate
 */
function handleDuplicateTrip(tripId) {
  try {
    const duplicatedTrip = tripManager.duplicateTrip(tripId);

    if (duplicatedTrip) {
      showToast('Trip duplicated! ✓');
      renderDashboard();
    } else {
      showToast('Trip not found ⚠️');
    }
  } catch (error) {
    console.error('Error duplicating trip:', error);

    if (error.message.includes('quota')) {
      showToast('Storage full! Delete some trips first. ⚠️');
    } else {
      showToast('Error duplicating trip ⚠️');
    }
  }
}

/**
 * Handle delete trip
 * @param {string} tripId - Trip ID to delete
 */
function handleDeleteTrip(tripId) {
  const trip = tripManager.getTrip(tripId);

  if (!trip) {
    showToast('Trip not found ⚠️');
    return;
  }

  // Store trip ID for confirmation
  currentDeleteTripId = tripId;

  // Update modal text
  document.getElementById('deleteModalText').textContent =
    `Are you sure you want to delete "${trip.name}"? This action cannot be undone.`;

  // Show delete confirmation modal
  const modal = document.getElementById('deleteModal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');

  // Attach confirm button handler
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  confirmBtn.onclick = confirmDeleteTrip;
}

/**
 * Confirm and execute trip deletion
 */
function confirmDeleteTrip() {
  if (!currentDeleteTripId) return;

  try {
    const success = tripManager.deleteTrip(currentDeleteTripId);

    if (success) {
      showToast('Trip deleted ✓');
      renderDashboard();
    } else {
      showToast('Trip not found ⚠️');
    }
  } catch (error) {
    console.error('Error deleting trip:', error);
    showToast('Error deleting trip ⚠️');
  }

  closeDeleteModal();
  currentDeleteTripId = null;
}

/**
 * Close delete confirmation modal
 */
function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  currentDeleteTripId = null;
}

/**
 * Handle search and sort
 */
function handleSearchAndSort() {
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();
  const sortBy = document.getElementById('sortSelect').value;

  let trips = tripManager.getAllTrips();

  // Filter by search
  if (searchQuery) {
    trips = trips.filter(trip =>
      trip.name.toLowerCase().includes(searchQuery) ||
      trip.destination.toLowerCase().includes(searchQuery)
    );
  }

  // Sort
  trips = sortTrips(trips, sortBy);

  // Render filtered results
  const tripGrid = document.getElementById('tripGrid');

  if (trips.length === 0) {
    tripGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
        <p style="font-size: 1.2rem; color: var(--gray-color);">No trips found matching "${searchQuery}"</p>
      </div>
    `;
  } else {
    tripGrid.innerHTML = trips.map(trip => renderTripCard(trip)).join('');
    attachCardEventListeners();
  }
}

/**
 * Sort trips by criteria
 * @param {Array} trips - Array of trip objects
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted trips
 */
function sortTrips(trips, sortBy) {
  switch (sortBy) {
    case 'recent':
      return trips.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    case 'name':
      return trips.sort((a, b) => a.name.localeCompare(b.name));

    case 'upcoming':
      return trips.sort((a, b) => {
        const dateA = new Date(a.startDate || '9999-12-31');
        const dateB = new Date(b.startDate || '9999-12-31');
        return dateA - dateB;
      });

    default:
      return trips;
  }
}

/**
 * Check localStorage usage and show warning if near limit
 */
function checkStorageUsage() {
  const storageInfo = tripManager.getStorageInfo();

  if (storageInfo.isNearLimit) {
    const warningBanner = document.getElementById('storageWarning');
    document.getElementById('storagePercent').textContent = Math.round(storageInfo.percentage);
    warningBanner.style.display = 'flex';
  }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ========== Utility Functions ==========

/**
 * Calculate duration between two dates
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {number} Number of days
 */
function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // Include both start and end day
}

/**
 * Format date range for display
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {string} Formatted date range
 */
function formatDateRange(startDate, endDate) {
  if (!startDate) return 'No dates set';

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  const options = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);

  if (!end || startDate === endDate) {
    return startStr;
  }

  const endStr = end.toLocaleDateString('en-US', options);

  // If same year, show year once
  if (start.getFullYear() === end.getFullYear()) {
    return `${startStr} - ${endStr}, ${start.getFullYear()}`;
  }

  return `${startStr}, ${start.getFullYear()} - ${endStr}, ${end.getFullYear()}`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
