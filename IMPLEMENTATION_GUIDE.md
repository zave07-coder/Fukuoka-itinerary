# Travel Planning App - Feature Implementation Guide

## Overview
This guide provides a comprehensive implementation plan for adding 6 major features to the trip planner application. All implementations are designed to be modular, maintainable, and mobile-responsive.

---

## Feature 1: Multi-Day Route Display with Toggle

### Description
Add the ability to toggle between viewing routes for all days simultaneously (with different colors per day) vs. viewing a single day's route.

### Data Model Changes
No changes needed - the current trip structure already supports this.

### Implementation

#### 1.1 Add Day Color Palette (trip-planner-v2.js)
```javascript
// Add at the top of the file, after the global variables
const DAY_COLORS = [
  '#3b82f6', // Day 1 - Blue
  '#ef4444', // Day 2 - Red
  '#10b981', // Day 3 - Green
  '#f59e0b', // Day 4 - Amber
  '#8b5cf6', // Day 5 - Purple
  '#ec4899', // Day 6 - Pink
  '#14b8a6', // Day 7 - Teal
  '#f97316', // Day 8 - Orange
  '#6366f1', // Day 9 - Indigo
  '#84cc16'  // Day 10 - Lime
];

// Track current map view mode
let mapViewMode = 'all'; // 'all' or 'single'
let currentRoutes = []; // Store route layer IDs for cleanup
```

#### 1.2 Update filterMapByDay Function (trip-planner-v2.js)
```javascript
/**
 * Filter map markers and draw routes by day
 * Enhanced to support multi-day route display
 */
function filterMapByDay(day) {
  if (!map || !currentTrip || !currentTrip.days) return;

  // Clear existing routes
  clearAllRoutes();

  if (day === 'all' && mapViewMode === 'all') {
    // Show all markers and all day routes
    markers.forEach(marker => marker.getElement().style.opacity = '1');

    // Draw routes for all days with different colors
    currentTrip.days.forEach((dayData, dayIndex) => {
      const dayLocations = extractDayLocations(dayData);
      if (dayLocations.length > 1) {
        drawRoute(dayLocations, dayIndex + 1, DAY_COLORS[dayIndex % DAY_COLORS.length]);
      }
    });

    // Fit all markers
    fitAllMarkers();
  } else if (day === 'all' && mapViewMode === 'single') {
    // Show all markers but no routes
    markers.forEach(marker => marker.getElement().style.opacity = '1');
    fitAllMarkers();
  } else {
    // Single day view
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
      drawRoute(dayLocations, dayNum, DAY_COLORS[(dayNum - 1) % DAY_COLORS.length]);
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
 * Extract locations from a day's activities
 */
function extractDayLocations(dayData) {
  const locations = [];
  if (dayData && dayData.activities) {
    dayData.activities.forEach(activity => {
      if (activity.location && activity.location.lat && activity.location.lng) {
        locations.push({
          lng: activity.location.lng,
          lat: activity.location.lat,
          name: activity.name
        });
      }
    });
  }
  return locations;
}

/**
 * Clear all route layers from map
 */
function clearAllRoutes() {
  currentRoutes.forEach(routeId => {
    if (map.getLayer(routeId)) {
      map.removeLayer(routeId);
    }
    if (map.getSource(routeId)) {
      map.removeSource(routeId);
    }
  });
  currentRoutes = [];
}

/**
 * Fit map to show all markers
 */
function fitAllMarkers() {
  if (markers.length > 0) {
    const bounds = new mapboxgl.LngLatBounds();
    markers.forEach(marker => bounds.extend(marker.getLngLat()));
    map.fitBounds(bounds, { padding: 50 });
  }
}
```

#### 1.3 Update drawRoute Function (trip-planner-v2.js)
```javascript
/**
 * Draw route between locations using Mapbox Directions API
 * Enhanced to support multiple routes with different colors
 */
async function drawRoute(locations, dayNumber, color) {
  if (!map || locations.length < 2) return;

  const coordinates = locations.map(l => `${l.lng},${l.lat}`).join(';');
  const routeId = `route-day-${dayNumber}`;

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
    );

    const data = await response.json();

    if (data.routes && data.routes[0]) {
      const route = data.routes[0].geometry;

      // Add route to map
      map.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            day: dayNumber
          },
          geometry: route
        }
      });

      map.addLayer({
        id: routeId,
        type: 'line',
        source: routeId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': color,
          'line-width': 4,
          'line-opacity': 0.75
        }
      });

      // Track route for cleanup
      currentRoutes.push(routeId);
    }
  } catch (error) {
    console.error('Error drawing route for day', dayNumber, ':', error);
  }
}
```

#### 1.4 Add View Toggle Handlers (trip-planner-v2.js)
```javascript
/**
 * Setup view toggle buttons
 */
function setupViewToggle() {
  const viewButtons = document.querySelectorAll('.view-btn');

  viewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;

      // Update active state
      viewButtons.forEach(b => b.classList.remove('view-btn-active'));
      e.currentTarget.classList.add('view-btn-active');

      // Update mode
      if (view === 'all') {
        mapViewMode = 'all';
        document.getElementById('daySelect').value = 'all';
        filterMapByDay('all');
      } else {
        mapViewMode = 'single';
        const currentDay = document.getElementById('daySelect').value;
        if (currentDay === 'all') {
          // Default to day 1 when switching to single view
          document.getElementById('daySelect').value = '1';
          filterMapByDay('1');
        } else {
          filterMapByDay(currentDay);
        }
      }
    });
  });
}

// Call this in the map load event
map.on('load', () => {
  console.log('Map loaded successfully ✅');
  updateMapMarkers();
  setupDaySelector();
  setupViewToggle(); // Add this line
});
```

#### 1.5 Update Legend to Show Day Colors (trip-planner-v2.html)
```html
<!-- Replace the existing map-legend-compact div -->
<div class="map-legend-compact" id="mapLegend">
  <div class="legend-item-compact">
    <span class="legend-dot legend-temple"></span>
    <span>Temples</span>
  </div>
  <div class="legend-item-compact">
    <span class="legend-dot legend-food"></span>
    <span>Food</span>
  </div>
  <div class="legend-item-compact">
    <span class="legend-dot legend-activity"></span>
    <span>Activities</span>
  </div>
  <div class="legend-item-compact">
    <span class="legend-dot legend-hotel"></span>
    <span>Hotels</span>
  </div>
</div>
```

---

## Feature 2: Budget Tracking

### Description
Add cost fields to activities and calculate daily/total budgets with visual indicators.

### Data Model Changes
Each activity will have an optional `cost` field (number in local currency).

### Implementation

#### 2.1 Update Activity Rendering (trip-planner-v2.js)
```javascript
/**
 * Render activity metadata - ENHANCED with cost
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

  // Add cost if available
  if (activity.cost !== undefined && activity.cost !== null) {
    items.push(`
      <div class="meta-item meta-cost">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v12M9 9h6M9 15h6"></path>
        </svg>
        <span>${formatCurrency(activity.cost)}</span>
      </div>
    `);
  }

  return items.length > 0 ? `<div class="activity-meta">${items.join('')}</div>` : '';
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  // Get currency from trip settings or default to USD
  const currency = currentTrip?.settings?.currency || 'USD';

  const formatMap = {
    'USD': `$${amount.toLocaleString()}`,
    'JPY': `¥${amount.toLocaleString()}`,
    'EUR': `€${amount.toLocaleString()}`,
    'GBP': `£${amount.toLocaleString()}`,
  };

  return formatMap[currency] || `${amount.toLocaleString()} ${currency}`;
}

/**
 * Calculate total cost for a day
 */
function calculateDayCost(day) {
  if (!day.activities) return 0;

  return day.activities.reduce((total, activity) => {
    return total + (activity.cost || 0);
  }, 0);
}

/**
 * Calculate total cost for entire trip
 */
function calculateTripCost(trip) {
  if (!trip.days) return 0;

  return trip.days.reduce((total, day) => {
    return total + calculateDayCost(day);
  }, 0);
}
```

#### 2.2 Update Day Card Header with Budget (trip-planner-v2.js)
```javascript
/**
 * Render a single day card - ENHANCED with budget
 */
function renderDayCard(day, dayNumber) {
  const activities = day.activities || [];
  const date = calculateDayDate(currentTrip.startDate, dayNumber - 1);
  const dayCost = calculateDayCost(day);
  const budget = day.budget || 0;

  return `
    <section class="day-card" data-day="${dayNumber}">
      <div class="day-card-header">
        <div class="day-number-badge">Day ${dayNumber}</div>
        <div class="day-info">
          <h2 class="day-title">${escapeHtml(day.title || `Day ${dayNumber}`)}</h2>
          <p class="day-date">${formatDate(date)}</p>
          ${dayCost > 0 ? `
            <div class="day-budget-bar">
              <div class="budget-info">
                <span class="budget-spent">${formatCurrency(dayCost)}</span>
                ${budget > 0 ? `
                  <span class="budget-separator">/</span>
                  <span class="budget-total">${formatCurrency(budget)}</span>
                  <span class="budget-status ${dayCost > budget ? 'over-budget' : 'within-budget'}">
                    ${dayCost > budget ? 'Over' : 'OK'}
                  </span>
                ` : ''}
              </div>
              ${budget > 0 ? `
                <div class="budget-progress">
                  <div class="budget-progress-bar ${dayCost > budget ? 'over-budget' : ''}"
                       style="width: ${Math.min((dayCost / budget) * 100, 100)}%"></div>
                </div>
              ` : ''}
            </div>
          ` : ''}
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
```

#### 2.3 Add Budget Summary Widget to Header (trip-planner-v2.html)
```html
<!-- Add this after the trip-meta div in the header -->
<div class="trip-budget-summary" id="tripBudgetSummary" style="display: none;">
  <div class="budget-summary-content">
    <span class="budget-label">Trip Budget:</span>
    <span class="budget-amount" id="budgetAmount">$0</span>
    <span class="budget-separator">/</span>
    <span class="budget-total" id="budgetTotal">$0</span>
  </div>
</div>
```

#### 2.4 Update renderTrip to Show Budget Summary (trip-planner-v2.js)
```javascript
/**
 * Render trip data to the page - ENHANCED with budget
 */
function renderTrip() {
  if (!currentTrip) return;

  // Update header
  document.querySelector('.trip-title').textContent = currentTrip.name || 'Untitled Trip';
  document.querySelector('.trip-meta').textContent = formatTripMeta(currentTrip);
  document.title = `${currentTrip.name} | Wahgola`;

  // Update budget summary
  const totalCost = calculateTripCost(currentTrip);
  const totalBudget = currentTrip.budget || 0;

  if (totalCost > 0 || totalBudget > 0) {
    const budgetSummary = document.getElementById('tripBudgetSummary');
    if (budgetSummary) {
      budgetSummary.style.display = 'flex';
      document.getElementById('budgetAmount').textContent = formatCurrency(totalCost);
      document.getElementById('budgetTotal').textContent = formatCurrency(totalBudget);

      if (totalCost > totalBudget && totalBudget > 0) {
        budgetSummary.classList.add('over-budget');
      } else {
        budgetSummary.classList.remove('over-budget');
      }
    }
  }

  // Render days
  const itineraryPanel = document.querySelector('.itinerary-panel');
  itineraryPanel.innerHTML = renderDays(currentTrip.days || []);

  // Update day selector dropdown
  updateDaySelector();

  // Update map
  if (currentTrip.days && currentTrip.days.length > 0) {
    updateMapMarkers();
  }
}
```

#### 2.5 Budget Styles (trip-planner-v2.css)
```css
/* Budget Tracking Styles */
.trip-budget-summary {
  display: flex;
  align-items: center;
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.trip-budget-summary.over-budget {
  background: #fef2f2;
  color: #991b1b;
}

.budget-summary-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.budget-label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.budget-amount {
  font-weight: 700;
  color: var(--color-primary);
}

.trip-budget-summary.over-budget .budget-amount {
  color: #dc2626;
}

.budget-separator {
  color: var(--color-text-tertiary);
}

.day-budget-bar {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.budget-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
  margin-bottom: var(--space-2);
}

.budget-spent {
  font-weight: 700;
  color: var(--color-primary);
}

.budget-total {
  color: var(--color-text-secondary);
}

.budget-status {
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.budget-status.within-budget {
  background: #d1fae5;
  color: #065f46;
}

.budget-status.over-budget {
  background: #fee2e2;
  color: #991b1b;
}

.budget-progress {
  height: 6px;
  background: var(--color-border-light);
  border-radius: 3px;
  overflow: hidden;
}

.budget-progress-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.budget-progress-bar.over-budget {
  background: #dc2626;
}

.meta-cost {
  color: var(--color-primary);
  font-weight: 600;
}
```

---

## Feature 3: Export to PDF

### Description
Export the trip itinerary as a PDF document with proper formatting.

### Implementation

#### 3.1 Add jsPDF Library (trip-planner-v2.html)
```html
<!-- Add before closing </head> tag -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

#### 3.2 Add Export Button to Header (trip-planner-v2.html)
```html
<!-- Add this button in the trip-header-actions div -->
<button class="action-btn" onclick="exportToPDF()" title="Export to PDF">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
</button>
```

#### 3.3 PDF Export Function (trip-planner-v2.js)
```javascript
/**
 * Export trip to PDF
 */
async function exportToPDF() {
  if (!currentTrip) {
    showToast('No trip to export', 2000, 'error');
    return;
  }

  showToast('Generating PDF... This may take a moment', 3000, 'info');

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Title
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(currentTrip.name || 'Trip Itinerary', margin, yPos);
    yPos += 10;

    // Trip meta
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(formatTripMeta(currentTrip), margin, yPos);
    yPos += 8;

    // Budget summary
    const totalCost = calculateTripCost(currentTrip);
    const totalBudget = currentTrip.budget || 0;
    if (totalCost > 0 || totalBudget > 0) {
      doc.setFontSize(11);
      doc.text(`Total Budget: ${formatCurrency(totalCost)} / ${formatCurrency(totalBudget)}`, margin, yPos);
      yPos += 10;
    }

    // Separator
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Days
    currentTrip.days.forEach((day, dayIndex) => {
      checkPageBreak(30);

      // Day header
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`Day ${dayIndex + 1}: ${day.title || `Day ${dayIndex + 1}`}`, margin + 3, yPos + 8);
      yPos += 15;

      // Day date and budget
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const date = calculateDayDate(currentTrip.startDate, dayIndex);
      doc.text(formatDate(date), margin, yPos);

      const dayCost = calculateDayCost(day);
      if (dayCost > 0) {
        doc.text(`Budget: ${formatCurrency(dayCost)}`, pageWidth - margin - 40, yPos);
      }
      yPos += 8;

      // Activities
      if (day.activities && day.activities.length > 0) {
        day.activities.forEach((activity, actIndex) => {
          checkPageBreak(25);

          // Activity time
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(37, 99, 235);
          doc.text(activity.time || '', margin, yPos);
          yPos += 1;

          // Activity name
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(activity.name || '', margin + 20, yPos + 4);
          yPos += 6;

          // Activity description
          if (activity.details || activity.description) {
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(80, 80, 80);
            const descLines = doc.splitTextToSize(
              activity.details || activity.description,
              contentWidth - 20
            );
            doc.text(descLines, margin + 20, yPos);
            yPos += (descLines.length * 4) + 2;
          }

          // Activity metadata
          const metaItems = [];
          if (activity.location && activity.location.address) {
            metaItems.push(`📍 ${activity.location.address}`);
          }
          if (activity.duration) {
            metaItems.push(`⏱ ${activity.duration}`);
          }
          if (activity.cost) {
            metaItems.push(`💰 ${formatCurrency(activity.cost)}`);
          }

          if (metaItems.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text(metaItems.join('  •  '), margin + 20, yPos);
            yPos += 6;
          }

          yPos += 3;
        });
      }

      yPos += 5;
    });

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by Wahgola on ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Save PDF
    const fileName = `${(currentTrip.name || 'trip').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
    doc.save(fileName);

    showToast('PDF exported successfully!', 2000, 'success');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    showToast('Failed to export PDF. Please try again.', 3000, 'error');
  }
}
```

---

## Feature 4: Search and Filter Activities

### Description
Add a search box and filter buttons to quickly find specific activities across all days.

### Implementation

#### 4.1 Add Search/Filter UI (trip-planner-v2.html)
```html
<!-- Add this right before the itinerary-panel content starts -->
<div class="search-filter-bar">
  <div class="search-box">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
    <input
      type="text"
      id="activitySearch"
      placeholder="Search activities..."
      oninput="handleActivitySearch()"
    />
    <button class="search-clear" id="searchClear" onclick="clearSearch()" style="display: none;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>

  <div class="filter-chips">
    <button class="filter-chip active" data-filter="all" onclick="handleActivityFilter('all')">
      All
    </button>
    <button class="filter-chip" data-filter="temple" onclick="handleActivityFilter('temple')">
      🏛️ Temples
    </button>
    <button class="filter-chip" data-filter="food" onclick="handleActivityFilter('food')">
      🍜 Food
    </button>
    <button class="filter-chip" data-filter="nature" onclick="handleActivityFilter('nature')">
      🌿 Nature
    </button>
    <button class="filter-chip" data-filter="activity" onclick="handleActivityFilter('activity')">
      🎪 Activities
    </button>
    <button class="filter-chip" data-filter="hotel" onclick="handleActivityFilter('hotel')">
      🏨 Hotels
    </button>
  </div>

  <div class="search-results-info" id="searchResultsInfo" style="display: none;">
    <span id="searchResultsText"></span>
    <button class="btn-text-small" onclick="clearAllFilters()">Clear filters</button>
  </div>
</div>
```

#### 4.2 Search/Filter Functions (trip-planner-v2.js)
```javascript
// Track current filters
let currentSearchQuery = '';
let currentActivityFilter = 'all';

/**
 * Handle activity search
 */
function handleActivitySearch() {
  const searchInput = document.getElementById('activitySearch');
  const searchClear = document.getElementById('searchClear');

  currentSearchQuery = searchInput.value.toLowerCase().trim();

  // Show/hide clear button
  searchClear.style.display = currentSearchQuery ? 'flex' : 'none';

  // Apply filters
  applyActivityFilters();
}

/**
 * Handle activity filter by type
 */
function handleActivityFilter(filterType) {
  currentActivityFilter = filterType;

  // Update active state
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');

  // Apply filters
  applyActivityFilters();
}

/**
 * Apply all active filters
 */
function applyActivityFilters() {
  const allActivityItems = document.querySelectorAll('.activity-item');
  const allDayCards = document.querySelectorAll('.day-card');
  let visibleCount = 0;
  let totalCount = 0;

  allDayCards.forEach(dayCard => {
    const activities = dayCard.querySelectorAll('.activity-item');
    let dayHasVisibleActivities = false;

    activities.forEach(activityItem => {
      totalCount++;
      let isVisible = true;

      // Get activity data
      const activityName = activityItem.querySelector('.activity-name')?.textContent.toLowerCase() || '';
      const activityDesc = activityItem.querySelector('.activity-description')?.textContent.toLowerCase() || '';
      const activityType = activityItem.querySelector('.activity-type')?.className.split(' ').pop()?.replace('activity-type-', '') || '';

      // Apply search filter
      if (currentSearchQuery) {
        const matchesSearch = activityName.includes(currentSearchQuery) ||
                            activityDesc.includes(currentSearchQuery);
        if (!matchesSearch) {
          isVisible = false;
        }
      }

      // Apply type filter
      if (currentActivityFilter !== 'all') {
        const matchesType = activityType === currentActivityFilter;
        if (!matchesType) {
          isVisible = false;
        }
      }

      // Show/hide activity
      if (isVisible) {
        activityItem.style.display = 'flex';
        visibleCount++;
        dayHasVisibleActivities = true;
      } else {
        activityItem.style.display = 'none';
      }
    });

    // Show/hide entire day card
    if (dayHasVisibleActivities) {
      dayCard.style.display = 'block';
    } else {
      dayCard.style.display = 'none';
    }
  });

  // Update results info
  const resultsInfo = document.getElementById('searchResultsInfo');
  const resultsText = document.getElementById('searchResultsText');

  if (currentSearchQuery || currentActivityFilter !== 'all') {
    resultsInfo.style.display = 'flex';
    resultsText.textContent = `Showing ${visibleCount} of ${totalCount} activities`;
  } else {
    resultsInfo.style.display = 'none';
  }
}

/**
 * Clear search
 */
function clearSearch() {
  document.getElementById('activitySearch').value = '';
  currentSearchQuery = '';
  document.getElementById('searchClear').style.display = 'none';
  applyActivityFilters();
}

/**
 * Clear all filters
 */
function clearAllFilters() {
  clearSearch();
  handleActivityFilter('all');
}
```

#### 4.3 Search/Filter Styles (trip-planner-v2.css)
```css
/* Search and Filter Bar */
.search-filter-bar {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.search-box svg {
  position: absolute;
  left: var(--space-3);
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.search-box input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  padding-left: 40px;
  padding-right: 40px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-sans);
  outline: none;
  transition: all var(--transition-fast);
}

.search-box input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-clear {
  position: absolute;
  right: var(--space-2);
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.search-clear:hover {
  background: var(--color-border-light);
  color: var(--color-text-primary);
}

.filter-chips {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-chip {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  background: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.filter-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.search-results-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.btn-text-small {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.btn-text-small:hover {
  color: var(--color-primary-hover);
}

@media (max-width: 768px) {
  .filter-chips {
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .filter-chips::-webkit-scrollbar {
    display: none;
  }
}
```

---

## Feature 5: Duplicate Day

### Description
Allow users to copy a day's activities to create a new day or replace another day.

### Implementation

#### 5.1 Add Duplicate Button to Day Actions (trip-planner-v2.js)
```javascript
/**
 * Render a single day card - ENHANCED with duplicate button
 */
function renderDayCard(day, dayNumber) {
  const activities = day.activities || [];
  const date = calculateDayDate(currentTrip.startDate, dayNumber - 1);
  const dayCost = calculateDayCost(day);
  const budget = day.budget || 0;

  return `
    <section class="day-card" data-day="${dayNumber}">
      <div class="day-card-header">
        <div class="day-number-badge">Day ${dayNumber}</div>
        <div class="day-info">
          <h2 class="day-title">${escapeHtml(day.title || `Day ${dayNumber}`)}</h2>
          <p class="day-date">${formatDate(date)}</p>
          ${dayCost > 0 ? `<!-- Budget bar HTML here -->` : ''}
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
          <button class="day-action-btn" onclick="openDuplicateDayModal(${dayNumber})" title="Duplicate day">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
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
```

#### 5.2 Add Duplicate Day Modal (trip-planner-v2.html)
```html
<!-- Add this modal after the AI Edit Modal -->
<div class="modal-overlay" id="duplicateDayModal" style="display: none;">
  <div class="modal-modern">
    <button class="modal-close-modern" onclick="closeDuplicateDayModal()">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <div class="modal-header-modern">
      <h2>Duplicate Day</h2>
      <p id="duplicateDaySubtitle">Choose how to duplicate this day</p>
    </div>

    <div class="duplicate-form">
      <div class="form-group-modern">
        <label for="duplicateAction">Action:</label>
        <select id="duplicateAction" class="form-select">
          <option value="new">Add as new day at the end</option>
          <option value="replace">Replace an existing day</option>
        </select>
      </div>

      <div class="form-group-modern" id="replaceDayGroup" style="display: none;">
        <label for="replaceDaySelect">Replace which day?</label>
        <select id="replaceDaySelect" class="form-select">
          <!-- Populated dynamically -->
        </select>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeDuplicateDayModal()">Cancel</button>
        <button class="btn-primary" onclick="executeDuplicateDay()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Duplicate</span>
        </button>
      </div>
    </div>
  </div>
</div>
```

#### 5.3 Duplicate Day Functions (trip-planner-v2.js)
```javascript
// Track which day is being duplicated
let sourceDayIndex = null;

/**
 * Open duplicate day modal
 */
function openDuplicateDayModal(dayNum) {
  sourceDayIndex = dayNum - 1;

  const modal = document.getElementById('duplicateDayModal');
  const subtitle = document.getElementById('duplicateDaySubtitle');
  const dayTitle = currentTrip.days[sourceDayIndex]?.title || `Day ${dayNum}`;

  subtitle.textContent = `Duplicate "${dayTitle}"`;

  // Populate replace day dropdown
  const replaceDaySelect = document.getElementById('replaceDaySelect');
  let options = '';
  currentTrip.days.forEach((day, index) => {
    if (index !== sourceDayIndex) {
      const title = day.title || `Day ${index + 1}`;
      options += `<option value="${index}">Day ${index + 1}: ${title}</option>`;
    }
  });
  replaceDaySelect.innerHTML = options;

  modal.style.display = 'flex';

  // Setup action change listener
  document.getElementById('duplicateAction').addEventListener('change', (e) => {
    const replaceDayGroup = document.getElementById('replaceDayGroup');
    replaceDayGroup.style.display = e.target.value === 'replace' ? 'block' : 'none';
  });
}

/**
 * Close duplicate day modal
 */
function closeDuplicateDayModal() {
  const modal = document.getElementById('duplicateDayModal');
  modal.style.display = 'none';
  sourceDayIndex = null;
}

/**
 * Execute day duplication
 */
function executeDuplicateDay() {
  if (sourceDayIndex === null || !currentTrip) {
    showToast('Error: No day selected', 2000, 'error');
    return;
  }

  const action = document.getElementById('duplicateAction').value;
  const sourceDay = currentTrip.days[sourceDayIndex];

  // Deep clone the day
  const duplicatedDay = JSON.parse(JSON.stringify(sourceDay));
  duplicatedDay.title = `${sourceDay.title || `Day ${sourceDayIndex + 1}`} (Copy)`;

  if (action === 'new') {
    // Add as new day at the end
    currentTrip.days.push(duplicatedDay);
    showToast(`Day added as Day ${currentTrip.days.length}`, 2000, 'success');
  } else if (action === 'replace') {
    // Replace existing day
    const targetDayIndex = parseInt(document.getElementById('replaceDaySelect').value);
    const targetDayTitle = currentTrip.days[targetDayIndex]?.title || `Day ${targetDayIndex + 1}`;

    if (confirm(`Are you sure you want to replace "${targetDayTitle}"? This cannot be undone.`)) {
      currentTrip.days[targetDayIndex] = duplicatedDay;
      showToast(`Day ${targetDayIndex + 1} replaced successfully`, 2000, 'success');
    } else {
      return;
    }
  }

  // Save changes
  tripManager.updateTrip(currentTripId, currentTrip);

  // Close modal and refresh
  closeDuplicateDayModal();
  setTimeout(() => window.location.reload(), 1000);
}
```

#### 5.4 Duplicate Modal Styles (trip-planner-v2.css)
```css
/* Duplicate Day Modal */
.duplicate-form {
  padding: var(--space-6);
}

.form-group-modern {
  margin-bottom: var(--space-4);
}

.form-group-modern label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.form-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: white;
  cursor: pointer;
  outline: none;
  transition: all var(--transition-fast);
}

.form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
```

---

## Feature 6: Mobile Responsive Improvements

### Description
Enhance mobile experience with better touch interactions, optimized layouts, and mobile-specific features.

### Implementation

#### 6.1 Enhanced Mobile Styles (trip-planner-v2.css)
```css
/* Enhanced Mobile Responsive Design */
@media (max-width: 768px) {
  :root {
    --gap: 12px;
    --header-height: 64px;
  }

  /* Header optimizations */
  .trip-header-content {
    padding: 0 var(--space-3);
  }

  .trip-title {
    font-size: 15px;
  }

  .trip-meta {
    font-size: 11px;
  }

  .back-btn-header {
    width: 36px;
    height: 36px;
  }

  /* Hide less important header actions on mobile */
  .action-btn {
    width: 36px;
    height: 36px;
  }

  .btn-ai-edit {
    padding: var(--space-2);
  }

  .btn-ai-edit span {
    display: none;
  }

  /* Map panel - full width and shorter */
  .split-layout {
    flex-direction: column;
    padding: var(--space-3);
  }

  .map-panel {
    width: 100%;
    position: relative;
    top: 0;
    height: 320px;
    margin-bottom: var(--space-4);
  }

  .map-controls-bar {
    flex-direction: column;
    gap: var(--space-2);
  }

  .view-toggle {
    width: 100%;
    justify-content: space-between;
  }

  .day-selector-compact {
    width: 100%;
  }

  /* Day cards */
  .day-card {
    margin-bottom: var(--space-4);
  }

  .day-card-header {
    padding: var(--space-3);
    flex-wrap: wrap;
  }

  .day-number-badge {
    width: 44px;
    height: 44px;
    font-size: 13px;
  }

  .day-title {
    font-size: 16px;
  }

  .day-date {
    font-size: 12px;
  }

  .day-actions {
    width: 100%;
    margin-top: var(--space-3);
    justify-content: flex-end;
  }

  /* Activities */
  .activities-list {
    padding: var(--space-3);
    gap: var(--space-4);
  }

  .activity-item {
    flex-direction: column;
    gap: var(--space-2);
  }

  .activity-time-wrapper {
    width: 100%;
  }

  .time-badge {
    font-size: 12px;
  }

  .activity-image-wrapper {
    width: 100%;
    height: 180px;
    float: none;
    margin-left: 0;
    margin-bottom: var(--space-3);
  }

  .activity-name {
    font-size: 16px;
  }

  .activity-description {
    font-size: 14px;
  }

  .activity-meta {
    flex-direction: column;
    gap: var(--space-2);
  }

  .activity-actions {
    width: 100%;
  }

  .activity-action-btn {
    flex: 1;
    justify-content: center;
  }

  /* AI Day Edit button - icon only */
  .btn-ai-day span {
    display: none;
  }

  .btn-ai-day {
    width: 36px;
    height: 36px;
    padding: 0;
    justify-content: center;
  }

  /* Search and Filter */
  .search-filter-bar {
    padding: var(--space-3);
  }

  .filter-chips {
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    padding-bottom: var(--space-2);
  }

  .filter-chip {
    flex-shrink: 0;
  }

  /* Modals */
  .modal-overlay {
    padding: var(--space-4);
  }

  .modal-modern {
    max-width: 100%;
  }

  .modal-header-modern {
    padding: var(--space-4);
  }

  .modal-header-modern h2 {
    font-size: 20px;
  }

  .ai-form,
  .duplicate-form {
    padding: var(--space-4);
  }

  .modal-actions {
    flex-direction: column-reverse;
    padding: var(--space-4);
  }

  .modal-actions button {
    width: 100%;
  }

  /* Budget display */
  .budget-info {
    flex-wrap: wrap;
    font-size: 12px;
  }

  .trip-budget-summary {
    margin-top: var(--space-3);
    padding: var(--space-2);
    font-size: 12px;
  }
}

/* Touch improvements for all mobile devices */
@media (hover: none) and (pointer: coarse) {
  /* Increase touch targets */
  .activity-action-btn,
  .day-action-btn,
  .action-btn,
  .view-btn,
  .filter-chip {
    min-height: 44px;
    min-width: 44px;
  }

  /* Disable hover effects */
  .activity-item:hover {
    padding-left: 0;
    margin-left: 0;
  }

  .activity-item:hover .activity-image {
    transform: none;
  }

  /* Better tap feedback */
  .btn-primary:active,
  .btn-secondary:active,
  .activity-action-btn:active {
    transform: scale(0.98);
  }
}

/* Very small screens (< 375px) */
@media (max-width: 375px) {
  .day-card-header {
    padding: var(--space-2);
  }

  .activities-list {
    padding: var(--space-2);
  }

  .day-title {
    font-size: 15px;
  }

  .activity-name {
    font-size: 15px;
  }
}
```

#### 6.2 Add Touch Gestures for Mobile (trip-planner-v2.js)
```javascript
/**
 * Setup mobile-specific features
 */
function setupMobileFeatures() {
  // Check if mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) return;

  // Add pull-to-refresh hint
  let touchStartY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const touchDiff = touchY - touchStartY;

    if (touchDiff > 0 && window.scrollY === 0) {
      // Show pull to refresh hint
      document.body.classList.add('pull-hint');
    } else {
      document.body.classList.remove('pull-hint');
    }
  }, { passive: true });

  // Enable momentum scrolling for filter chips
  const filterChips = document.querySelector('.filter-chips');
  if (filterChips) {
    filterChips.style.webkitOverflowScrolling = 'touch';
  }
}

// Call in DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  loadTripFromURL();
  initializeMap();
  setupMobileFeatures(); // Add this line
});
```

---

## Implementation Checklist

### Phase 1: Core Features
- [ ] Multi-day route display with color coding
- [ ] Budget tracking and display
- [ ] Search and filter functionality

### Phase 2: Advanced Features
- [ ] PDF export
- [ ] Duplicate day functionality
- [ ] Mobile responsive enhancements

### Phase 3: Testing
- [ ] Test on desktop browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Test with different trip sizes (1 day, 7 days, 14 days)
- [ ] Test budget calculations with various currencies
- [ ] Test PDF export with long itineraries

### Phase 4: Polish
- [ ] Add loading states for async operations
- [ ] Improve error messages
- [ ] Add keyboard shortcuts (optional)
- [ ] Add tooltips for better UX

---

## Testing Scenarios

### 1. Multi-Day Routes
- Toggle between "All Days" and "Day View"
- Select individual days and verify route colors
- Verify routes display correctly with 2+ locations per day
- Test with days that have no locations

### 2. Budget Tracking
- Add costs to activities
- Verify daily budget calculations
- Verify trip total budget
- Test over-budget visual indicators
- Test with different currency formats

### 3. PDF Export
- Export trip with 1 day
- Export trip with 7+ days
- Verify all data appears in PDF
- Check page breaks
- Verify special characters render correctly

### 4. Search/Filter
- Search by activity name
- Search by description text
- Filter by activity type
- Combine search + filter
- Clear filters and verify reset

### 5. Duplicate Day
- Duplicate as new day
- Replace existing day
- Verify all activity data copied correctly
- Test with days containing images

### 6. Mobile Responsive
- Test on iPhone (various sizes)
- Test on Android phones
- Test landscape orientation
- Test touch interactions
- Verify no horizontal scroll

---

## Browser Compatibility

All features are designed to work on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 9+)

---

## Performance Considerations

1. **Route Drawing**: Routes are cached and only redrawn when necessary
2. **Search/Filter**: Uses CSS display properties for instant filtering
3. **PDF Generation**: Runs asynchronously to avoid blocking UI
4. **Mobile**: Reduced animations and effects on mobile devices
5. **Images**: Lazy loading for activity images (can be added)

---

## Future Enhancements

1. **Offline Support**: Service worker for offline viewing
2. **Collaborative Editing**: Real-time collaboration on trips
3. **Photo Upload**: Custom photos for activities
4. **Print Stylesheet**: Alternative to PDF for quick printing
5. **Expense Splitting**: Split costs among travelers
6. **Weather Integration**: Show forecast for each day
7. **Map Clustering**: Cluster markers when zoomed out
8. **Activity Notes**: Personal notes for each activity
9. **Checklists**: Packing lists and pre-trip todos
10. **Share Links**: Generate shareable trip URLs

---

## Support

For questions or issues:
1. Check browser console for errors
2. Verify Mapbox token is valid
3. Test with sample data first
4. Clear localStorage and retry

---

*Implementation Guide v1.0 - Generated 2026-04-01*
