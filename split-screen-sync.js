// Split-screen accordion and map synchronization

// History management with localStorage
function saveHistoryToLocalStorage() {
    try {
        localStorage.setItem('fukuoka_itinerary_history', JSON.stringify({
            history: editHistory,
            index: editHistoryIndex
        }));
    } catch (e) {
        console.error('Failed to save history:', e);
    }
}

function loadHistoryFromLocalStorage() {
    try {
        const saved = localStorage.getItem('fukuoka_itinerary_history');
        if (saved) {
            const data = JSON.parse(saved);
            editHistory = data.history || [];
            editHistoryIndex = data.index || -1;
            updateUndoRedoButtons();
        }
    } catch (e) {
        console.error('Failed to load history:', e);
    }
}

function showHistorySidebar() {
    const sidebar = document.getElementById('historySidebar');
    const content = document.getElementById('historyContent');

    if (!sidebar || !content) return;

    // Build history HTML
    if (editHistory.length === 0) {
        content.innerHTML = '<p style="padding: 1rem; color: #666;">No changes yet. Make some edits to see your history here!</p>';
    } else {
        content.innerHTML = '';
        editHistory.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            if (index === editHistoryIndex) {
                historyItem.classList.add('current');
            }

            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-time">${timeStr}</span>
                    <span class="history-count">${item.edits.length} change${item.edits.length > 1 ? 's' : ''}</span>
                </div>
                <div class="history-item-content">
                    ${item.edits.map(e => `<div class="history-edit">
                        <span class="history-badge ${e.type}">${e.type}</span>
                        Day ${e.dayNumber}: ${e.content.substring(0, 60)}${e.content.length > 60 ? '...' : ''}
                    </div>`).join('')}
                </div>
            `;

            content.appendChild(historyItem);
        });
    }

    sidebar.classList.add('open');
}

// Toggle accordion
function toggleAccordion(header) {
    const item = header.parentElement;
    const wasActive = item.classList.contains('active');

    // Close all accordion items and update ARIA attributes
    document.querySelectorAll('.accordion-item').forEach(accordion => {
        accordion.classList.remove('active');
        const accordionHeader = accordion.querySelector('.accordion-header');
        if (accordionHeader) {
            accordionHeader.setAttribute('aria-expanded', 'false');
        }
    });

    // Open clicked item if it wasn't active
    if (!wasActive) {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');

        // Sync with map
        const dayNumber = item.getAttribute('data-day');
        if (dayNumber && window.updateMapForDay) {
            window.updateMapForDay(dayNumber);
        }

        // Update day selector
        const daySelector = document.getElementById('daySelector');
        if (daySelector) {
            daySelector.value = dayNumber;
        }

        // Scroll accordion item into view
        setTimeout(() => {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Keyboard navigation for accordion headers
document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard event listeners to all accordion headers
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('keydown', function(event) {
            // Handle Enter and Space keys
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleAccordion(this);
            }
        });
    });
});

// Day selector change handler
document.addEventListener('DOMContentLoaded', function() {
    const daySelector = document.getElementById('daySelector');

    if (daySelector) {
        daySelector.addEventListener('change', function() {
            const selectedDay = this.value;

            if (selectedDay === 'overview') {
                // Show all markers
                if (window.showAllMarkers) {
                    window.showAllMarkers();
                }
                // Close all accordions
                document.querySelectorAll('.accordion-item').forEach(item => {
                    item.classList.remove('active');
                    const header = item.querySelector('.accordion-header');
                    if (header) {
                        header.setAttribute('aria-expanded', 'false');
                    }
                });
            } else {
                // Update map for specific day
                if (window.updateMapForDay) {
                    window.updateMapForDay(selectedDay);
                }

                // Open corresponding accordion
                const accordionItem = document.querySelector(`.accordion-item[data-day="${selectedDay}"]`);
                if (accordionItem) {
                    // Close all first
                    document.querySelectorAll('.accordion-item').forEach(item => {
                        item.classList.remove('active');
                        const header = item.querySelector('.accordion-header');
                        if (header) {
                            header.setAttribute('aria-expanded', 'false');
                        }
                    });

                    // Open selected
                    accordionItem.classList.add('active');
                    const selectedHeader = accordionItem.querySelector('.accordion-header');
                    if (selectedHeader) {
                        selectedHeader.setAttribute('aria-expanded', 'true');
                    }

                    // Scroll into view
                    setTimeout(() => {
                        accordionItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            }
        });
    }

    // Show all markers button
    const showAllBtn = document.getElementById('showAllMarkersBtn');
    if (showAllBtn) {
        showAllBtn.addEventListener('click', function() {
            if (window.showAllMarkers) {
                window.showAllMarkers();
            }

            // Reset day selector
            const selector = document.getElementById('daySelector');
            if (selector) {
                selector.value = 'overview';
            }

            // Close all accordions
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });
        });
    }

    // Open Day 1 by default
    const firstDay = document.querySelector('.accordion-item[data-day="1"]');
    if (firstDay) {
        firstDay.classList.add('active');
    }
});

// AI Sidebar Functionality
let currentAIContext = null;
let currentAIMode = 'chat'; // 'chat' or 'edit'
let pendingEdits = null;
let editHistory = [];
let editHistoryIndex = -1;

window.openAISidebar = function(type, button = null) {
    console.log('[AI] openAISidebar called with type:', type, 'button:', button);
    const sidebar = document.getElementById('aiSidebar');
    if (!sidebar) {
        console.error('[AI] Sidebar element not found!');
        return;
    }

    console.log('[AI] Sidebar found, opening...');

    // Set context
    if (type === 'day' && button) {
        const accordionItem = button.closest('.accordion-item');
        const dayNumber = accordionItem.getAttribute('data-day');
        const dayTitle = accordionItem.querySelector('.day-title-short').textContent;

        currentAIContext = {
            type: 'day',
            dayNumber: dayNumber,
            dayTitle: dayTitle
        };

        console.log('[AI] Context set for day:', dayNumber);
        // Add context message
        addAIMessage('bot', `I'll help you edit <strong>Day ${dayNumber}</strong>. What would you like to change?`);
    } else {
        currentAIContext = { type: 'trip' };
        console.log('[AI] Context set for entire trip');
        addAIMessage('bot', `I'll help you edit your <strong>entire trip</strong>. What changes would you like to make?`);
    }

    sidebar.classList.add('open');
    console.log('[AI] Sidebar opened successfully');
    setTimeout(() => {
        const input = document.getElementById('aiInput');
        if (input) input.focus();
    }, 300);
};

window.closeAISidebar = function() {
    const sidebar = document.getElementById('aiSidebar');
    sidebar.classList.remove('open');
    currentAIContext = null;
};

function addAIMessage(sender, content) {
    const messagesDiv = document.getElementById('aiMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-${sender}`;

    // Configure marked.js for better line breaks
    if (typeof marked !== 'undefined' && !marked.configured) {
        marked.setOptions({
            breaks: true,  // Convert \n to <br>
            gfm: true      // GitHub Flavored Markdown
        });
        marked.configured = true;
    }

    // Format bot messages with markdown, user messages stay plain
    const formattedContent = (sender === 'bot' && typeof marked !== 'undefined')
        ? marked.parse(content)
        : content;

    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="ai-avatar">🤖</div>
            <div class="ai-content">${formattedContent}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="ai-content">${formattedContent}</div>
            <div class="ai-avatar">👤</div>
        `;
    }

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addAIMessage('user', message);
    input.value = '';

    // Show loading
    const sendBtn = document.getElementById('aiSend');
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<span>⏳</span>';
    sendBtn.disabled = true;

    try {
        if (currentAIMode === 'edit') {
            // Auto-edit mode: Generate structured edits
            const context = currentAIContext?.type === 'day'
                ? `Editing Day ${currentAIContext.dayNumber}: ${currentAIContext.dayTitle}`
                : `Editing entire 10-day Fukuoka family trip`;

            // Get current itinerary content
            const currentContent = getCurrentItineraryContent();

            const response = await fetch('/api/ai-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    context,
                    currentContent
                })
            });

            const editData = await response.json();

            if (editData.error) {
                addAIMessage('bot', `<span style="color: #f5576c;">Error: ${editData.error}</span>`);
            } else {
                // Show preview modal
                showEditPreview(editData);
                addAIMessage('bot', `✨ I've prepared ${editData.edits?.length || 0} changes. Review them in the preview!`);
            }

        } else {
            // Chat mode: Just suggestions
            let systemPrompt = currentAIContext?.type === 'day'
                ? `You are helping edit Day ${currentAIContext.dayNumber} (${currentAIContext.dayTitle}) of a Fukuoka trip. Give specific, actionable suggestions.`
                : `You are helping edit a 10-day Fukuoka family trip. Give practical suggestions.`;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `${systemPrompt}\n\n${message}`
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                addAIMessage('bot', `## ❌ Error\n\nFailed to parse response (HTTP ${response.status})\n\nRaw error: ${parseError.message}`);
                return;
            }

            console.log('API Response:', response.status, data);

            // Show detailed error if present (check both HTTP status and error field)
            if (!response.ok || data.error) {
                const errorMsg = data.details?.error?.message || data.error || 'Unknown error';
                const modelRequested = data.requestedModel || 'unknown';

                // Build formatted error message
                let errorDisplay = `## ❌ Error (HTTP ${response.status})\n\n`;
                errorDisplay += `**Message:** ${errorMsg}\n\n`;
                errorDisplay += `**Model Requested:** \`${modelRequested}\`\n\n`;

                if (data.details) {
                    errorDisplay += `### Full Error Details:\n\n`;
                    errorDisplay += '```json\n' + JSON.stringify(data.details, null, 2) + '\n```';
                }

                addAIMessage('bot', errorDisplay);
            } else {
                addAIMessage('bot', data.reply);
            }
        }

    } catch (error) {
        addAIMessage('bot', `<span style="color: #f5576c;">Sorry, there was an error: ${error.message}</span>`);
    } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

function getCurrentItineraryContent() {
    // Extract current itinerary from the DOM
    const days = [];
    document.querySelectorAll('.accordion-item').forEach(item => {
        const dayNum = item.getAttribute('data-day');
        const title = item.querySelector('.day-title-short')?.textContent || '';
        const activities = Array.from(item.querySelectorAll('.activity-item')).map(a => a.textContent.trim());

        days.push({
            day: dayNum,
            title,
            activities
        });
    });

    return JSON.stringify(days, null, 2);
}

function showEditPreview(editData) {
    pendingEdits = editData;

    const modal = document.getElementById('editPreviewModal');
    const explanation = document.getElementById('editExplanation');
    const changes = document.getElementById('editChanges');

    explanation.textContent = editData.explanation || 'AI has generated the following changes:';

    changes.innerHTML = '';
    (editData.edits || []).forEach((edit, index) => {
        const changeItem = document.createElement('div');
        changeItem.className = 'edit-change-item';
        changeItem.innerHTML = `
            <div class="edit-change-checkbox">
                <input type="checkbox" id="edit-${index}" checked data-edit-index="${index}">
            </div>
            <div class="edit-change-body">
                <div class="edit-change-header">
                    <span class="edit-change-badge ${edit.type}">${edit.type.toUpperCase()}</span>
                    <span class="edit-change-day">Day ${edit.dayNumber} • ${edit.timeSlot || 'General'}</span>
                </div>
                <div class="edit-change-content">${edit.content}</div>
                ${edit.reason && edit.reason !== 'undefined' ? `<div class="edit-change-reason">💡 ${edit.reason}</div>` : ''}
                ${edit.location && edit.location.name ? `<div class="edit-change-location">📍 ${edit.location.name}</div>` : ''}
            </div>
        `;
        changes.appendChild(changeItem);
    });

    modal.classList.add('active');
}

window.closeEditPreview = function() {
    document.getElementById('editPreviewModal').classList.remove('active');
    pendingEdits = null;
};

window.applyEdits = function() {
    if (!pendingEdits || !pendingEdits.edits) return;

    // Get selected edits only
    const selectedEdits = [];
    document.querySelectorAll('#editChanges input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) {
            const index = parseInt(checkbox.dataset.editIndex);
            selectedEdits.push(pendingEdits.edits[index]);
        }
    });

    if (selectedEdits.length === 0) {
        addAIMessage('bot', '⚠️ No changes selected. Please select at least one change to apply.');
        return;
    }

    // Store snapshot before applying edits
    const snapshot = captureCurrentState();

    // Apply selected edits to the DOM
    selectedEdits.forEach(edit => {
        applyEditToDOM(edit);
    });

    // Save to history (clear redo stack)
    editHistory = editHistory.slice(0, editHistoryIndex + 1);
    editHistory.push({
        timestamp: new Date().toISOString(),
        edits: selectedEdits,
        beforeState: snapshot
    });
    editHistoryIndex = editHistory.length - 1;

    // Save history to localStorage
    saveHistoryToLocalStorage();

    updateUndoRedoButtons();

    // Show success message
    addAIMessage('bot', `<strong>✅ Applied ${selectedEdits.length} of ${pendingEdits.edits.length} changes successfully!</strong>`);

    closeEditPreview();
};

function captureCurrentState() {
    // Capture current DOM state for undo
    const state = {};
    document.querySelectorAll('.accordion-item').forEach(item => {
        const dayNum = item.getAttribute('data-day');
        state[dayNum] = item.innerHTML;
    });
    return state;
}

function restoreState(state) {
    // Restore DOM from snapshot
    Object.keys(state).forEach(dayNum => {
        const item = document.querySelector(`.accordion-item[data-day="${dayNum}"]`);
        if (item) {
            item.innerHTML = state[dayNum];
        }
    });
}

window.undoLastEdit = function() {
    if (editHistoryIndex < 0) return;

    const edit = editHistory[editHistoryIndex];
    if (edit.beforeState) {
        restoreState(edit.beforeState);
    }

    editHistoryIndex--;
    updateUndoRedoButtons();

    addAIMessage('bot', '↶ <strong>Undid last change</strong>');
};

window.redoEdit = function() {
    if (editHistoryIndex >= editHistory.length - 1) return;

    editHistoryIndex++;
    const edit = editHistory[editHistoryIndex];

    // Reapply the edits
    edit.edits.forEach(e => applyEditToDOM(e));

    updateUndoRedoButtons();

    addAIMessage('bot', '↷ <strong>Redid change</strong>');
};

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('aiUndo');
    const redoBtn = document.getElementById('aiRedo');

    if (undoBtn) {
        undoBtn.disabled = editHistoryIndex < 0;
    }

    if (redoBtn) {
        redoBtn.disabled = editHistoryIndex >= editHistory.length - 1;
    }
}

function applyEditToDOM(edit) {
    const accordionItem = document.querySelector(`.accordion-item[data-day="${edit.dayNumber}"]`);
    if (!accordionItem) return;

    const contentArea = accordionItem.querySelector('.accordion-content');
    if (!contentArea) return;

    // Create or modify activity based on edit type
    if (edit.type === 'add') {
        const newActivity = document.createElement('div');
        newActivity.className = 'activity-item';
        newActivity.innerHTML = `
            <div class="time-badge">${edit.timeSlot}</div>
            <div class="activity-details">
                <p>${edit.content}</p>
            </div>
        `;
        contentArea.appendChild(newActivity);

    } else if (edit.type === 'modify') {
        // Find matching activity by time slot
        const activities = contentArea.querySelectorAll('.activity-item');
        for (const activity of activities) {
            const timeBadge = activity.querySelector('.time-badge');
            if (timeBadge && timeBadge.textContent.includes(edit.timeSlot)) {
                const details = activity.querySelector('.activity-details p');
                if (details) {
                    details.textContent = edit.content;
                }
                break;
            }
        }

    } else if (edit.type === 'remove') {
        // Find and remove matching activity
        const activities = contentArea.querySelectorAll('.activity-item');
        for (const activity of activities) {
            const timeBadge = activity.querySelector('.time-badge');
            if (timeBadge && timeBadge.textContent.includes(edit.timeSlot)) {
                activity.remove();
                break;
            }
        }
    }

    // Highlight the day that was edited
    accordionItem.style.borderLeft = '4px solid #667eea';
    setTimeout(() => {
        accordionItem.style.borderLeft = '';
    }, 3000);

    // Update map markers if location-related edit
    updateMapForEdit(edit);
}

function updateMapForEdit(edit) {
    // Check if edit has location data with GPS coordinates
    if (!edit.location || !edit.location.lat || !edit.location.lng) {
        console.log('No location data in edit:', edit);
        return;
    }

    console.log('Attempting to update map for edit:', edit.location);

    // Access the global map and markers if available
    if (typeof window.map === 'undefined') {
        console.warn('window.map not available - map not initialized');
        return;
    }

    if (typeof mapboxgl === 'undefined') {
        console.warn('mapboxgl library not loaded');
        return;
    }

    const loc = edit.location;
    console.log('Adding marker for:', loc.name, 'at', loc.lat, loc.lng);

    if (edit.type === 'add' || edit.type === 'modify') {
        // Add new marker to map
        const el = document.createElement('div');
        el.className = 'custom-mapbox-marker';
        el.innerHTML = getMarkerEmojiForType(loc.type);
        el.style.cursor = 'pointer';

        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                <div style="padding: 8px;">
                    <strong>${loc.name}</strong><br>
                    <span style="font-size: 0.9em; color: #666;">${edit.content}</span>
                </div>
            `);

        const marker = new mapboxgl.Marker(el)
            .setLngLat([loc.lng, loc.lat])
            .setPopup(popup)
            .addTo(window.map);

        // Store marker reference for potential removal
        if (!window.aiAddedMarkers) window.aiAddedMarkers = [];
        window.aiAddedMarkers.push({
            marker,
            editId: `day${edit.dayNumber}_${edit.timeSlot}`,
            location: loc
        });

        // Fly to new location
        window.map.flyTo({
            center: [loc.lng, loc.lat],
            zoom: 15,
            duration: 1500
        });
    }
}

function getMarkerEmojiForType(type) {
    const emojiMap = {
        restaurant: '🍜',
        cafe: '☕',
        attraction: '🏛️',
        shop: '🛍️',
        temple: '⛩️',
        shrine: '⛩️',
        park: '🌳',
        museum: '🖼️',
        beach: '🏖️',
        tower: '🗼',
        castle: '🏯',
        other: '📍'
    };
    return emojiMap[type] || '📍';
}

window.sendAISuggestion = function(text) {
    document.getElementById('aiInput').value = text;
    sendAIMessage();
};

// Event listeners for AI sidebar
document.addEventListener('DOMContentLoaded', () => {
    console.log('[AI] Initializing AI sidebar event listeners...');

    // Load history from localStorage on page load
    loadHistoryFromLocalStorage();

    const toggleBtn = document.getElementById('aiToggle');
    const closeBtn = document.getElementById('aiClose');
    const sendBtn = document.getElementById('aiSend');
    const input = document.getElementById('aiInput');
    const undoBtn = document.getElementById('aiUndo');
    const redoBtn = document.getElementById('aiRedo');
    const editTripBtn = document.getElementById('editTripBtn');

    console.log('[AI] Elements found:', { toggleBtn: !!toggleBtn, editTripBtn: !!editTripBtn, closeBtn: !!closeBtn });

    if (toggleBtn) {
        console.log('[AI] Attaching click handler to aiToggle');
        toggleBtn.addEventListener('click', () => {
            console.log('[AI] Toggle button clicked!');
            openAISidebar('trip');
        });
    } else {
        console.error('[AI] aiToggle button not found!');
    }

    if (editTripBtn) {
        console.log('[AI] Attaching click handler to editTripBtn');
        editTripBtn.addEventListener('click', () => {
            console.log('[AI] Edit Trip button clicked!');
            openAISidebar('trip');
        });
    } else {
        console.error('[AI] editTripBtn button not found!');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAISidebar);
    }

    // Event delegation for day edit buttons
    console.log('[AI] Setting up event delegation for day edit buttons');
    document.addEventListener('click', (e) => {
        const dayEditBtn = e.target.closest('[data-action="edit-day"]');
        if (dayEditBtn) {
            console.log('[AI] Day edit button clicked!', dayEditBtn);
            e.stopPropagation();
            e.preventDefault();
            openAISidebar('day', dayEditBtn);
        }
    });

    if (sendBtn) {
        sendBtn.addEventListener('click', sendAIMessage);
    }

    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
            }
        });
    }

    if (undoBtn) {
        undoBtn.addEventListener('click', undoLastEdit);
    }

    if (redoBtn) {
        redoBtn.addEventListener('click', redoEdit);
    }

    // Main toolbar undo/redo buttons (in version-control toolbar)
    const mainUndoBtn = document.getElementById('undoBtn');
    const mainRedoBtn = document.getElementById('redoBtn');

    if (mainUndoBtn) {
        mainUndoBtn.addEventListener('click', undoLastEdit);
    }

    if (mainRedoBtn) {
        mainRedoBtn.addEventListener('click', redoEdit);
    }

    // Update both sets of buttons whenever history changes
    const originalUpdateButtons = updateUndoRedoButtons;
    window.updateUndoRedoButtons = function() {
        // Update AI sidebar buttons
        originalUpdateButtons();

        // Update toolbar buttons
        if (mainUndoBtn) {
            mainUndoBtn.disabled = editHistoryIndex < 0;
        }
        if (mainRedoBtn) {
            mainRedoBtn.disabled = editHistoryIndex >= editHistory.length - 1;
        }
    };

    // History sidebar
    const historyBtn = document.getElementById('historyBtn');
    const historySidebar = document.getElementById('historySidebar');
    const closeHistoryBtn = document.getElementById('closeHistory');

    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            showHistorySidebar();
        });
    }

    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', () => {
            historySidebar?.classList.remove('open');
        });
    }

    // Mode toggle buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAIMode = btn.getAttribute('data-mode');

            // Update placeholder based on mode
            if (input) {
                if (currentAIMode === 'edit') {
                    input.placeholder = 'Describe the changes you want (e.g., "Add more beach time to Day 3")';
                    addAIMessage('bot', '✨ <strong>Auto-Edit mode activated!</strong> I\'ll generate changes and show you a preview before applying.');
                } else {
                    input.placeholder = 'Tell me what you\'d like to change about your trip...';
                    addAIMessage('bot', '💬 <strong>Chat mode activated!</strong> I\'ll give you suggestions.');
                }
            }
        });
    });

    // Preview modal buttons
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const cancelPreviewBtn = document.getElementById('cancelPreviewBtn');
    const applyEditsBtn = document.getElementById('applyEditsBtn');

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', closeEditPreview);
    }

    if (cancelPreviewBtn) {
        cancelPreviewBtn.addEventListener('click', closeEditPreview);
    }

    if (applyEditsBtn) {
        applyEditsBtn.addEventListener('click', applyEdits);
    }

    // Suggestion buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('ai-suggestion-btn')) {
            const suggestion = e.target.getAttribute('data-suggestion');
            if (suggestion) {
                sendAISuggestion(suggestion);
            }
        }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAISidebar();
            closeEditPreview();
        }
    });
});

// Function to be called from map markers
window.selectDayFromMap = function(dayNumber) {
    // Update day selector
    const daySelector = document.getElementById('daySelector');
    if (daySelector) {
        daySelector.value = dayNumber;
    }

    // Open corresponding accordion
    const accordionItem = document.querySelector(`.accordion-item[data-day="${dayNumber}"]`);
    if (accordionItem) {
        // Close all first
        document.querySelectorAll('.accordion-item').forEach(item => {
            item.classList.remove('active');
        });

        // Open selected
        accordionItem.classList.add('active');

        // Scroll into view in itinerary panel
        setTimeout(() => {
            const itineraryPanel = document.querySelector('.itinerary-panel');
            if (itineraryPanel) {
                const accordionTop = accordionItem.offsetTop;
                itineraryPanel.scrollTo({
                    top: accordionTop - 200,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
};

// ========================================
// MOBILE NAVIGATION ENHANCEMENTS
// ========================================

// Mobile Bottom Navigation - Active State Management
(function initMobileBottomNav() {
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

    if (mobileNavItems.length === 0) return;

    // Update active state based on scroll position
    const updateActiveNav = () => {
        const sections = ['main-content', 'map', 'restaurants', 'tips'];
        let currentSection = '';

        // Find which section is currently in view
        for (const sectionId of sections) {
            const section = document.getElementById(sectionId) || document.querySelector(`[id="${sectionId}"]`);
            if (section) {
                const rect = section.getBoundingClientRect();
                const viewportMiddle = window.innerHeight / 2;

                // Check if section is in middle of viewport
                if (rect.top <= viewportMiddle && rect.bottom >= viewportMiddle) {
                    currentSection = sectionId;
                    break;
                }
            }
        }

        // Update active states
        mobileNavItems.forEach(item => {
            const href = item.getAttribute('href');
            if (!href) return;

            const targetId = href.substring(1); // Remove '#'

            if (targetId === currentSection ||
                (targetId === 'itinerary' && currentSection === 'main-content')) {
                item.classList.add('active');
                item.setAttribute('aria-current', 'page');
            } else {
                item.classList.remove('active');
                item.removeAttribute('aria-current');
            }
        });
    };

    // Throttle scroll event for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateActiveNav, 100);
    }, { passive: true });

    // Smooth scroll with offset for mobile nav
    mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const href = item.getAttribute('href');
            if (!href) return;

            const targetId = href.substring(1);
            let targetElement = document.getElementById(targetId);

            // Handle special case for itinerary
            if (targetId === 'itinerary') {
                targetElement = document.getElementById('main-content');
            }

            if (targetElement) {
                const navbar = document.getElementById('navbar');
                const navbarHeight = navbar?.offsetHeight || 60;
                const offset = navbarHeight + 10;

                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Provide haptic feedback on mobile (if supported)
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
            }
        });
    });

    // Initial update
    setTimeout(updateActiveNav, 500);
})();

// Mobile navigation toggle with improved accessibility
(function setupMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');

    if (!navToggle || !navLinks) return;

    // Toggle mobile menu
    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navLinks.classList.toggle('active');

        // Haptic feedback if supported
        if ('vibrate' in navigator && !isExpanded) {
            navigator.vibrate(10);
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navToggle.setAttribute('aria-expanded', 'false');
            navLinks.classList.remove('active');
        }
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.setAttribute('aria-expanded', 'false');
            navLinks.classList.remove('active');
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            navToggle.setAttribute('aria-expanded', 'false');
            navLinks.classList.remove('active');
            navToggle.focus();
        }
    });
})();

// Enhanced accessibility - Focus trap for mobile menu
(function setupFocusTrap() {
    const navLinks = document.querySelector('.nav-links');
    const navToggle = document.getElementById('navToggle');

    if (!navLinks || !navToggle) return;

    // Get all focusable elements within nav
    const getFocusableElements = () => {
        return navLinks.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    };

    // Trap focus when mobile menu is open
    navLinks.addEventListener('keydown', (e) => {
        if (!navLinks.classList.contains('active')) return;

        const focusable = Array.from(getFocusableElements());
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];

        // Tab key handling
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });

    // When menu opens, focus first item
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isActive = navLinks.classList.contains('active');
                if (isActive) {
                    const focusable = getFocusableElements();
                    if (focusable.length > 0) {
                        setTimeout(() => focusable[0].focus(), 100);
                    }
                }
            }
        });
    });

    observer.observe(navLinks, { attributes: true });
})();

// Touch gesture improvements for mobile
(function setupTouchGestures() {
    // Prevent double-tap zoom on buttons
    const preventDoubleTapZoom = (selector) => {
        document.querySelectorAll(selector).forEach(element => {
            let lastTap = 0;
            element.addEventListener('touchend', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0) {
                    e.preventDefault();
                }
                lastTap = currentTime;
            }, { passive: false });
        });
    };

    // Apply to all interactive elements
    preventDoubleTapZoom('button, .nav-link, .accordion-header, .mobile-nav-item, .ai-edit-day-btn');

    // Add touch feedback class
    document.querySelectorAll('button, a, .accordion-header').forEach(element => {
        element.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        }, { passive: true });

        element.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('touch-active');
            }, 150);
        }, { passive: true });
    });
})();
