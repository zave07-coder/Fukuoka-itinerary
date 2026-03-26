// Split-screen accordion and map synchronization

// Toggle accordion
function toggleAccordion(header) {
    const item = header.parentElement;
    const wasActive = item.classList.contains('active');

    // Close all accordion items
    document.querySelectorAll('.accordion-item').forEach(accordion => {
        accordion.classList.remove('active');
    });

    // Open clicked item if it wasn't active
    if (!wasActive) {
        item.classList.add('active');

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
                    });

                    // Open selected
                    accordionItem.classList.add('active');

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
    const sidebar = document.getElementById('aiSidebar');
    if (!sidebar) return;

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

        // Add context message
        addAIMessage('bot', `I'll help you edit <strong>Day ${dayNumber}</strong>. What would you like to change?`);
    } else {
        currentAIContext = { type: 'trip' };
        addAIMessage('bot', `I'll help you edit your <strong>entire trip</strong>. What changes would you like to make?`);
    }

    sidebar.classList.add('open');
    setTimeout(() => document.getElementById('aiInput').focus(), 300);
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

    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="ai-avatar">🤖</div>
            <div class="ai-content">${content}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="ai-content">${content}</div>
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

            const data = await response.json();
            addAIMessage('bot', data.reply);
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
    (editData.edits || []).forEach(edit => {
        const changeItem = document.createElement('div');
        changeItem.className = 'edit-change-item';
        changeItem.innerHTML = `
            <div class="edit-change-header">
                <span class="edit-change-badge ${edit.type}">${edit.type.toUpperCase()}</span>
                <span class="edit-change-day">Day ${edit.dayNumber} • ${edit.timeSlot || 'General'}</span>
            </div>
            <div class="edit-change-content">${edit.content}</div>
            <div class="edit-change-reason">💡 ${edit.reason}</div>
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

    // Store snapshot before applying edits
    const snapshot = captureCurrentState();

    // Apply each edit to the DOM
    pendingEdits.edits.forEach(edit => {
        applyEditToDOM(edit);
    });

    // Save to history (clear redo stack)
    editHistory = editHistory.slice(0, editHistoryIndex + 1);
    editHistory.push({
        timestamp: new Date().toISOString(),
        edits: pendingEdits.edits,
        beforeState: snapshot
    });
    editHistoryIndex = editHistory.length - 1;

    updateUndoRedoButtons();

    // Show success message
    addAIMessage('bot', `<strong>✅ Applied ${pendingEdits.edits.length} changes successfully!</strong>`);

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
}

window.sendAISuggestion = function(text) {
    document.getElementById('aiInput').value = text;
    sendAIMessage();
};

// Event listeners for AI sidebar
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('aiToggle');
    const closeBtn = document.getElementById('aiClose');
    const sendBtn = document.getElementById('aiSend');
    const input = document.getElementById('aiInput');
    const undoBtn = document.getElementById('aiUndo');
    const redoBtn = document.getElementById('aiRedo');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => openAISidebar('trip'));
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAISidebar);
    }

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
