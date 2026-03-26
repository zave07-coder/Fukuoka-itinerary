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

    } catch (error) {
        addAIMessage('bot', `<span style="color: #f5576c;">Sorry, there was an error: ${error.message}</span>`);
    } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
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

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAISidebar();
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
