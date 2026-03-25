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
