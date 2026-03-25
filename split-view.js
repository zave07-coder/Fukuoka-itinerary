// Split-Screen View with Resizable Panels
let splitViewActive = false;
let changeHistory = [];
let currentHistoryIndex = -1;

// Initialize split view toggle button
function initSplitView() {
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-split-view';
    toggleBtn.innerHTML = '🗺️ Split View Mode';
    toggleBtn.onclick = toggleSplitView;
    document.body.appendChild(toggleBtn);

    // Load saved changes from localStorage
    loadSavedChanges();
}

function toggleSplitView() {
    splitViewActive = !splitViewActive;

    if (splitViewActive) {
        enableSplitView();
    } else {
        disableSplitView();
    }
}

function enableSplitView() {
    document.body.classList.add('split-view-active');

    // Create split container
    const splitContainer = document.createElement('div');
    splitContainer.className = 'split-container';
    splitContainer.id = 'splitViewContainer';

    // Left pane (Map)
    const leftPane = document.createElement('div');
    leftPane.className = 'split-pane split-pane-left';
    leftPane.innerHTML = `
        <div class="split-controls">
            <button class="split-btn split-btn-save" onclick="saveChanges()">💾 Save</button>
            <button class="split-btn split-btn-undo" onclick="undoChange()">↩️ Undo</button>
            <button class="split-btn split-btn-undo" onclick="redoChange()">↪️ Redo</button>
        </div>
        <div class="split-map-container">
            <h2 style="padding: 1rem; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">🗺️ Interactive Map</h2>
            <div id="splitMapView" style="height: calc(100% - 60px);"></div>
        </div>
    `;

    // Resizer
    const resizer = document.createElement('div');
    resizer.className = 'split-resizer';

    // Right pane (Details + Chat)
    const rightPane = document.createElement('div');
    rightPane.className = 'split-pane split-pane-right';
    rightPane.innerHTML = `
        <div class="split-details-panel" id="splitDetailsPanel">
            <h2>📋 Current Itinerary</h2>
            <div id="currentDayDetails"></div>
        </div>
        <div class="split-chat-panel" id="splitChatPanel">
            <!-- Chat will be moved here -->
        </div>
    `;

    splitContainer.appendChild(leftPane);
    splitContainer.appendChild(resizer);
    splitContainer.appendChild(rightPane);

    // Insert before footer
    const footer = document.querySelector('.footer');
    footer.parentNode.insertBefore(splitContainer, footer);

    // Initialize map in split view
    initSplitMap();

    // Move chat widget to split panel
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        document.getElementById('splitChatPanel').appendChild(chatWindow);
        chatWindow.classList.add('active'); // Show chat by default
        chatWindow.style.position = 'relative';
        chatWindow.style.width = '100%';
        chatWindow.style.height = '100%';
    }

    // Make resizer draggable
    makeResizable(resizer, leftPane, rightPane);

    // Load current day details
    loadDayDetails('all');

    // Update toggle button
    document.querySelector('.toggle-split-view').innerHTML = '📄 Normal View';
}

function disableSplitView() {
    document.body.classList.remove('split-view-active');

    // Remove split container
    const splitContainer = document.getElementById('splitViewContainer');
    if (splitContainer) {
        splitContainer.remove();
    }

    // Restore chat widget
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        document.getElementById('aiChatWidget').appendChild(chatWindow);
        chatWindow.classList.remove('active');
        chatWindow.style.position = '';
        chatWindow.style.width = '';
        chatWindow.style.height = '';
    }

    // Update toggle button
    document.querySelector('.toggle-split-view').innerHTML = '🗺️ Split View Mode';
}

function initSplitMap() {
    // Create new map instance in split view
    const splitMapDiv = document.getElementById('splitMapView');
    if (!splitMapDiv || !window.MAPBOX_CONFIG) return;

    const splitMap = new mapboxgl.Map({
        container: 'splitMapView',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [130.4017, 33.5904],
        zoom: 10,
        accessToken: window.MAPBOX_CONFIG.token
    });

    splitMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Copy markers from main map
    if (window.markers && window.markers.length > 0) {
        window.markers.forEach(markerData => {
            const el = document.createElement('div');
            el.className = 'custom-mapbox-marker';
            el.innerHTML = markerData.element.innerHTML;
            el.style.fontSize = '28px';
            el.style.cursor = 'pointer';

            const marker = new mapboxgl.Marker(el)
                .setLngLat([markerData.location.lng, markerData.location.lat])
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
                    `<strong>${markerData.location.name}</strong>`
                ))
                .addTo(splitMap);
        });
    }

    // Store split map reference
    window.splitMap = splitMap;
}

function makeResizable(resizer, leftPane, rightPane) {
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const container = resizer.parentElement;
        const containerRect = container.getBoundingClientRect();
        const leftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        if (leftWidth > 20 && leftWidth < 80) {
            leftPane.style.flex = `0 0 ${leftWidth}%`;
            rightPane.style.flex = `0 0 ${100 - leftWidth}%`;
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.style.cursor = '';
    });
}

function loadDayDetails(day) {
    const detailsPanel = document.getElementById('currentDayDetails');
    if (!detailsPanel) return;

    const dayCards = document.querySelectorAll('.day-card');
    let html = '';

    if (day === 'all') {
        dayCards.forEach(card => {
            const dayTitle = card.querySelector('.day-title')?.textContent || '';
            const dayNumber = card.querySelector('.day-number')?.textContent || '';
            const activities = card.querySelectorAll('.activity');

            html += `<div style="margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <h3 style="color: #667eea;">${dayNumber}: ${dayTitle}</h3>`;

            activities.forEach(activity => {
                const time = activity.querySelector('.activity-time')?.textContent || '';
                const title = activity.querySelector('h4')?.textContent || '';
                html += `<p style="margin: 0.5rem 0;"><strong>${time}</strong> - ${title}</p>`;
            });

            html += '</div>';
        });
    }

    detailsPanel.innerHTML = html || '<p>Select a day to view details</p>';
}

// Save changes to database
async function saveChanges() {
    const changes = {
        timestamp: new Date().toISOString(),
        mapUpdates: collectMapUpdates(),
        itineraryChanges: collectItineraryChanges()
    };

    try {
        const response = await fetch('/api/save-itinerary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'default',
                changes: changes.itineraryChanges,
                mapUpdates: changes.mapUpdates
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('✅ Changes saved successfully!', 'success');
        } else if (data.useLocalStorage) {
            // Fallback to localStorage
            saveToLocalStorage(changes);
            showNotification('💾 Saved to browser (database not configured)', 'info');
        }
    } catch (error) {
        console.error('Save error:', error);
        saveToLocalStorage(changes);
        showNotification('💾 Saved to browser only', 'warning');
    }
}

function saveToLocalStorage(changes) {
    changeHistory.push(changes);
    currentHistoryIndex = changeHistory.length - 1;
    localStorage.setItem('fukuoka_itinerary_changes', JSON.stringify(changeHistory));
}

function loadSavedChanges() {
    const saved = localStorage.getItem('fukuoka_itinerary_changes');
    if (saved) {
        try {
            changeHistory = JSON.parse(saved);
            currentHistoryIndex = changeHistory.length - 1;
        } catch (e) {
            console.error('Failed to load saved changes:', e);
        }
    }
}

function undoChange() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        applyChanges(changeHistory[currentHistoryIndex]);
        showNotification('↩️ Undo applied', 'info');
    } else {
        showNotification('No more changes to undo', 'warning');
    }
}

function redoChange() {
    if (currentHistoryIndex < changeHistory.length - 1) {
        currentHistoryIndex++;
        applyChanges(changeHistory[currentHistoryIndex]);
        showNotification('↪️ Redo applied', 'info');
    } else {
        showNotification('No more changes to redo', 'warning');
    }
}

function collectMapUpdates() {
    // Collect current map state
    return {
        addedMarkers: window.addedMarkers || [],
        removedMarkers: window.removedMarkers || []
    };
}

function collectItineraryChanges() {
    // Collect itinerary text changes
    return {
        modified: window.modifiedActivities || []
    };
}

function applyChanges(changes) {
    // Apply saved changes to map and itinerary
    console.log('Applying changes:', changes);
    // Implementation depends on what changes are stored
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#4ECDC4' : type === 'warning' ? '#FFE66D' : '#667eea'};
        color: ${type === 'warning' ? '#333' : 'white'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplitView);
} else {
    initSplitView();
}
