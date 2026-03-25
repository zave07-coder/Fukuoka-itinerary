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

// AI Edit Functionality
let currentEditContext = null;

window.openDayAIEdit = function(button) {
    const accordionItem = button.closest('.accordion-item');
    const dayNumber = accordionItem.getAttribute('data-day');
    const dayTitle = accordionItem.querySelector('.day-title-short').textContent;

    currentEditContext = {
        type: 'day',
        dayNumber: dayNumber,
        element: accordionItem
    };

    const modal = document.getElementById('aiEditModal');
    const title = document.getElementById('aiEditTitle');
    const context = document.getElementById('aiEditContext');
    const prompt = document.getElementById('aiEditPrompt');

    title.textContent = `Edit Day ${dayNumber} with AI`;
    context.textContent = `Editing: ${dayTitle}`;
    prompt.value = '';
    prompt.placeholder = `Example: Add more beach time, reduce driving, make it more kid-friendly...`;

    modal.classList.add('active');
    setTimeout(() => prompt.focus(), 100);
};

window.openTripAIEdit = function() {
    currentEditContext = {
        type: 'trip',
        element: document.querySelector('.itinerary-accordion')
    };

    const modal = document.getElementById('aiEditModal');
    const title = document.getElementById('aiEditTitle');
    const context = document.getElementById('aiEditContext');
    const prompt = document.getElementById('aiEditPrompt');

    title.textContent = 'Edit Entire Trip with AI';
    context.textContent = 'Editing: Full 10-day itinerary';
    prompt.value = '';
    prompt.placeholder = `Example: Add more cultural sites, include more hot springs, reduce daily driving time...`;

    modal.classList.add('active');
    setTimeout(() => prompt.focus(), 100);
};

window.closeAIEditModal = function() {
    const modal = document.getElementById('aiEditModal');
    modal.classList.remove('active');
    currentEditContext = null;
    document.getElementById('aiEditPrompt').value = '';
    document.getElementById('aiEditResult').style.display = 'none';
};

window.submitAIEdit = async function() {
    const prompt = document.getElementById('aiEditPrompt').value.trim();

    if (!prompt) {
        alert('Please enter what you\'d like to change');
        return;
    }

    const submitBtn = document.querySelector('.ai-edit-submit');
    const resultDiv = document.getElementById('aiEditResult');

    submitBtn.disabled = true;
    submitBtn.textContent = '✨ Generating...';
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p style="color: #666;">AI is thinking... This may take a few seconds.</p>';

    try {
        let systemPrompt = '';
        if (currentEditContext.type === 'day') {
            systemPrompt = `You are a travel itinerary editor. The user wants to modify Day ${currentEditContext.dayNumber} of their Fukuoka trip. Provide specific, actionable suggestions for changes. Keep it concise (3-5 bullet points).`;
        } else {
            systemPrompt = `You are a travel itinerary editor. The user wants to modify their entire 10-day Fukuoka trip. Provide high-level, strategic suggestions. Keep it concise (4-6 bullet points).`;
        }

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `${systemPrompt}\n\nUser request: ${prompt}`
            })
        });

        const data = await response.json();

        resultDiv.innerHTML = `
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #667eea;">
                <strong style="color: #667eea; display: block; margin-bottom: 0.5rem;">AI Suggestions:</strong>
                <div style="color: #333; white-space: pre-wrap;">${data.reply}</div>
            </div>
            <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
                <em>Note: These are suggestions. You can manually edit the itinerary in the page content.</em>
            </p>
        `;

    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #f5576c;">Error: ${error.message}</p>`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ Generate Changes';
    }
};

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAIEditModal();
    }
});

// Close modal on background click
document.getElementById('aiEditModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'aiEditModal') {
        closeAIEditModal();
    }
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
