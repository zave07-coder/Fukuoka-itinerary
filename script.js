// Navigation Toggle for Mobile
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const navHeight = navbar.offsetHeight;
            const targetPosition = target.offsetTop - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            navLinks.classList.remove('active');
        }
    });
});

// Filter Functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const dayCards = document.querySelectorAll('.day-card');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');

        dayCards.forEach(card => {
            const tags = card.getAttribute('data-tags');

            if (filterValue === 'all') {
                card.classList.remove('hidden');
                // Animate cards back in
                setTimeout(() => {
                    card.style.animation = 'fadeInUp 0.6s ease-out';
                }, 100);
            } else {
                if (tags.includes(filterValue)) {
                    card.classList.remove('hidden');
                    setTimeout(() => {
                        card.style.animation = 'fadeInUp 0.6s ease-out';
                    }, 100);
                } else {
                    card.classList.add('hidden');
                }
            }
        });
    });
});

// Intersection Observer for Fade-in Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all day cards and section elements
document.querySelectorAll('.day-card, .overview-card, .restaurant-card, .tip-card').forEach(el => {
    observer.observe(el);
});

// Add Print Functionality
function printItinerary() {
    window.print();
}

// Export to Calendar (ICS format)
function exportToCalendar() {
    const events = [
        {
            title: 'Arrive in Fukuoka',
            start: '2025-06-14T15:00:00',
            end: '2025-06-14T18:00:00',
            description: 'Pick up rental car, check into hotel, Canal City Hakata',
            location: 'Fukuoka, Japan'
        },
        {
            title: 'Fukuoka City Highlights - Ohori Park & Castle',
            start: '2025-06-15T09:00:00',
            end: '2025-06-15T18:00:00',
            description: 'Ohori Park, Fukuoka Castle Ruins, Hakata Ramen',
            location: 'Fukuoka, Japan'
        },
        {
            title: 'Marine World & Seaside Park',
            start: '2025-06-16T09:00:00',
            end: '2025-06-16T17:00:00',
            description: 'Aquarium with dolphin shows, Uminonakamichi Seaside Park',
            location: 'Uminonakamichi, Fukuoka'
        },
        {
            title: 'Yufuin & Beppu Hot Springs Road Trip',
            start: '2025-06-17T08:00:00',
            end: '2025-06-17T19:00:00',
            description: 'Yufuin town, Lake Kinrinko, Beppu Hells tour',
            location: 'Yufuin & Beppu, Oita'
        },
        {
            title: 'Relaxed Day - Anpanman Museum & Beach',
            start: '2025-06-18T10:00:00',
            end: '2025-06-18T17:00:00',
            description: 'Anpanman Museum, Momochi Seaside Park, Fukuoka Tower',
            location: 'Fukuoka, Japan'
        },
        {
            title: 'Dazaifu Cultural Day',
            start: '2025-06-19T09:00:00',
            end: '2025-06-19T17:00:00',
            description: 'Dazaifu Tenmangu Shrine, Kyushu National Museum',
            location: 'Dazaifu, Fukuoka'
        },
        {
            title: 'Karatsu Castle & Beach Day',
            start: '2025-06-20T09:00:00',
            end: '2025-06-20T18:00:00',
            description: 'Karatsu Castle, Pine Grove, Beach time',
            location: 'Karatsu, Saga'
        },
        {
            title: 'Nokonoshima Island Adventure',
            start: '2025-06-21T09:00:00',
            end: '2025-06-21T17:00:00',
            description: 'Ferry to island, Island Park with flowers and animals',
            location: 'Nokonoshima Island, Fukuoka'
        },
        {
            title: 'Flexible Day - Your Choice',
            start: '2025-06-22T10:00:00',
            end: '2025-06-22T17:00:00',
            description: 'Yanagawa river cruise or revisit favorites',
            location: 'Fukuoka, Japan'
        },
        {
            title: 'Departure from Fukuoka',
            start: '2025-06-23T10:00:00',
            end: '2025-06-23T14:00:00',
            description: 'Last-minute shopping, return rental car, departure',
            location: 'Fukuoka Airport'
        }
    ];

    // Generate ICS content
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Fukuoka Family Trip//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n';

    events.forEach(event => {
        icsContent += 'BEGIN:VEVENT\n';
        icsContent += `DTSTART:${event.start.replace(/[-:]/g, '')}\n`;
        icsContent += `DTEND:${event.end.replace(/[-:]/g, '')}\n`;
        icsContent += `SUMMARY:${event.title}\n`;
        icsContent += `DESCRIPTION:${event.description}\n`;
        icsContent += `LOCATION:${event.location}\n`;
        icsContent += 'STATUS:CONFIRMED\n';
        icsContent += 'END:VEVENT\n';
    });

    icsContent += 'END:VCALENDAR';

    // Create download link
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'fukuoka-trip-2025.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add to localStorage for offline access
function saveItineraryOffline() {
    const itineraryData = {
        savedDate: new Date().toISOString(),
        tripDates: 'June 14-23, 2025',
        days: Array.from(dayCards).map(card => ({
            day: card.getAttribute('data-day'),
            tags: card.getAttribute('data-tags'),
            html: card.innerHTML
        }))
    };

    localStorage.setItem('fukuokaItinerary', JSON.stringify(itineraryData));
    alert('Itinerary saved for offline viewing!');
}

// Check if there's a saved version
function loadSavedItinerary() {
    const saved = localStorage.getItem('fukuokaItinerary');
    if (saved) {
        console.log('Offline itinerary available');
    }
}

// Weather Integration (Mock - replace with actual API)
async function checkWeather() {
    // This would connect to a real weather API
    const weatherData = {
        forecast: 'Partly cloudy with chance of rain',
        temp: '24°C',
        humidity: '75%'
    };

    console.log('Weather forecast:', weatherData);
}

// Day Card Click to Expand/Collapse (Optional)
dayCards.forEach(card => {
    const header = card.querySelector('.day-header');

    header.addEventListener('click', () => {
        const content = card.querySelector('.day-content');
        card.classList.toggle('collapsed');

        if (card.classList.contains('collapsed')) {
            content.style.maxHeight = '0';
            content.style.padding = '0 2rem';
        } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.padding = '2rem';
        }
    });
});

// Budget Calculator
function calculateBudget() {
    const accommodation = 180000;
    const carRental = 70000;
    const gasAndTolls = 30000;
    const food = 100000;
    const activities = 40000;
    const total = accommodation + carRental + gasAndTolls + food + activities;

    return {
        accommodation,
        carRental,
        gasAndTolls,
        food,
        activities,
        total,
        totalUSD: Math.round(total / 150) // Rough conversion
    };
}

// Share Functionality
async function shareItinerary() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Fukuoka Family Adventure',
                text: 'Check out our 10-day Fukuoka itinerary!',
                url: window.location.href
            });
        } catch (error) {
            console.log('Share cancelled or failed');
        }
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press 'P' to print
    if (e.key === 'p' && e.ctrlKey) {
        e.preventDefault();
        printItinerary();
    }

    // Press 'S' to save offline
    if (e.key === 's' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        saveItineraryOffline();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSavedItinerary();

    // Add fade-in class to hero content
    const heroContent = document.querySelector('.hero-content');
    setTimeout(() => {
        heroContent.style.opacity = '1';
    }, 100);

    // Log welcome message
    console.log('%c🇯🇵 Fukuoka Family Adventure 🇯🇵', 'font-size: 20px; font-weight: bold; color: #667eea;');
    console.log('Trip dates: June 14-23, 2025');
    console.log('Have an amazing trip!');
});

// Add PWA support indicator
if ('serviceWorker' in navigator) {
    console.log('This site can work offline!');
}

// Countdown to trip
function getDaysUntilTrip() {
    const tripStart = new Date('2025-06-14');
    const today = new Date();
    const diffTime = tripStart - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        console.log(`${diffDays} days until your Fukuoka adventure!`);
    }
}

getDaysUntilTrip();

// Google Maps interaction enhancement
const mapIframe = document.querySelector('.map-container iframe');
if (mapIframe) {
    mapIframe.addEventListener('load', () => {
        console.log('Map loaded successfully');
    });
}

// Add visual feedback for filter changes
function addFilterFeedback() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

addFilterFeedback();

// Export functions for use in HTML
window.printItinerary = printItinerary;
window.exportToCalendar = exportToCalendar;
window.shareItinerary = shareItinerary;
window.saveItineraryOffline = saveItineraryOffline;

// ===== INTERACTIVE MAP WITH LEAFLET =====
const locations = [
    { name: "Fukuoka Airport", lat: 33.5859, lng: 130.4509, type: "airport", day: "1,10" },
    { name: "Hakata Station", lat: 33.5904, lng: 130.4206, type: "transport", day: "1" },
    { name: "Canal City Hakata", lat: 33.5897, lng: 130.4086, type: "shopping", day: "1" },
    { name: "Ohori Park", lat: 33.5844, lng: 130.3789, type: "park", day: "2" },
    { name: "Fukuoka Castle Ruins", lat: 33.5850, lng: 130.3805, type: "cultural", day: "2" },
    { name: "Momochi Seaside Park", lat: 33.5936, lng: 130.3583, type: "beach", day: "2" },
    { name: "Fukuoka Tower", lat: 33.5936, lng: 130.3580, type: "attraction", day: "2" },
    { name: "Marine World Uminonakamichi", lat: 33.6533, lng: 130.4044, type: "aquarium", day: "3" },
    { name: "Uminonakamichi Seaside Park", lat: 33.6569, lng: 130.4133, type: "park", day: "3" },
    { name: "Dazaifu Tenmangu Shrine", lat: 33.5227, lng: 130.5334, type: "shrine", day: "4" },
    { name: "Kyushu National Museum", lat: 33.5239, lng: 130.5361, type: "museum", day: "4" },
    { name: "Beppu Onsens", lat: 33.2845, lng: 131.4910, type: "onsen", day: "5" },
    { name: "Yufuin", lat: 33.2648, lng: 131.3633, type: "town", day: "6" },
    { name: "Karatsu Castle", lat: 33.4516, lng: 129.9686, type: "castle", day: "7" },
    { name: "Nijinomatsubara Pine Forest", lat: 33.4347, lng: 129.9742, type: "nature", day: "7" },
    { name: "Nokonoshima Island", lat: 33.6144, lng: 130.2806, type: "island", day: "8" },
    { name: "Tenjin Shopping District", lat: 33.5908, lng: 130.3993, type: "shopping", day: "9" },
    { name: "Kushida Shrine", lat: 33.5952, lng: 130.4120, type: "shrine", day: "9" }
];

let map;
let markers = [];

function initMap() {
    // Initialize the map centered on Fukuoka
    map = L.map('interactiveMap').setView([33.5904, 130.4017], 11);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Add markers for all locations
    locations.forEach(location => {
        const icon = getMarkerIcon(location.type);
        const marker = L.marker([location.lat, location.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <div style="text-align: center; padding: 0.5rem;">
                    <strong>${location.name}</strong><br>
                    <small>Day ${location.day}</small><br>
                    <small>${location.type.toUpperCase()}</small>
                </div>
            `);
        markers.push({ marker, location });
    });

    // Add custom controls
    addMapControls();
}

function getMarkerIcon(type) {
    const iconUrls = {
        airport: '✈️',
        transport: '🚂',
        shopping: '🛍️',
        park: '🌳',
        cultural: '🏯',
        beach: '🏖️',
        attraction: '🗼',
        aquarium: '🐠',
        shrine: '⛩️',
        museum: '🏛️',
        onsen: '♨️',
        town: '🏘️',
        castle: '🏰',
        nature: '🌲',
        island: '🏝️'
    };

    return L.divIcon({
        html: `<div style="font-size: 24px;">${iconUrls[type] || '📍'}</div>`,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
}

function addMapControls() {
    // Add a custom control for filtering
    const FilterControl = L.Control.extend({
        onAdd: function(map) {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            div.style.backgroundColor = 'white';
            div.style.padding = '10px';
            div.style.cursor = 'pointer';
            div.innerHTML = '<strong>🗺️ Filter</strong>';
            div.onclick = function() {
                alert('Click on markers to see location details!');
            };
            return div;
        }
    });

    map.addControl(new FilterControl({ position: 'topright' }));
}

// Initialize map when page loads
if (document.getElementById('interactiveMap')) {
    window.addEventListener('load', initMap);
}

// ===== AI CHAT ASSISTANT =====
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatMessages');

let conversationHistory = [];

// Toggle chat window
chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('active');
});

chatClose.addEventListener('click', () => {
    chatWindow.classList.remove('active');
});

// Send message on Enter key
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Send message on button click
chatSend.addEventListener('click', sendMessage);

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    chatInput.value = '';

    // Disable input while processing
    chatInput.disabled = true;
    chatSend.disabled = true;

    // Show typing indicator
    const typingDiv = addTypingIndicator();

    try {
        // Call OpenAI API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                conversationHistory,
                currentItinerary: getCurrentItinerary()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get response from AI');
        }

        const data = await response.json();

        // Remove typing indicator
        typingDiv.remove();

        // Add bot response
        addMessageToChat(data.message, 'bot');

        // Update itinerary if changes were made
        if (data.updates) {
            applyItineraryUpdates(data.updates);
        }

        // Update map if locations changed
        if (data.mapUpdates) {
            updateMapLocations(data.mapUpdates);
        }

        // Store conversation history
        conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: data.message }
        );

    } catch (error) {
        console.error('Chat error:', error);
        typingDiv.remove();
        addMessageToChat('Sorry, I encountered an error. Please try again later.', 'bot');
    } finally {
        chatInput.disabled = false;
        chatSend.disabled = false;
        chatInput.focus();
    }
}

function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;

    // Parse markdown-style formatting
    const formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = `<p>${formattedMessage}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

function getCurrentItinerary() {
    // Extract current itinerary data from the page
    const days = [];
    document.querySelectorAll('.day-card').forEach(card => {
        const dayNumber = card.querySelector('.day-number')?.textContent;
        const dayTitle = card.querySelector('.day-title')?.textContent;
        const activities = Array.from(card.querySelectorAll('.activity')).map(activity => {
            return {
                time: activity.querySelector('.time')?.textContent,
                title: activity.querySelector('h4')?.textContent,
                description: activity.querySelector('p')?.textContent
            };
        });
        days.push({ dayNumber, dayTitle, activities });
    });
    return days;
}

function applyItineraryUpdates(updates) {
    // Apply updates to the itinerary
    // This would modify the DOM based on AI suggestions
    console.log('Applying itinerary updates:', updates);

    // Show a notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: fadeInUp 0.3s ease;
    `;
    notification.textContent = '✓ Itinerary updated!';
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

function updateMapLocations(mapUpdates) {
    // Update map with new locations
    console.log('Updating map:', mapUpdates);

    if (mapUpdates.addLocations) {
        mapUpdates.addLocations.forEach(loc => {
            const icon = getMarkerIcon(loc.type || 'attraction');
            const marker = L.marker([loc.lat, loc.lng], { icon })
                .addTo(map)
                .bindPopup(`
                    <div style="text-align: center; padding: 0.5rem;">
                        <strong>${loc.name}</strong><br>
                        <small>New Location</small>
                    </div>
                `);
            markers.push({ marker, location: loc });
        });

        // Adjust map bounds to show all markers
        const bounds = L.latLngBounds(markers.map(m => m.marker.getLatLng()));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}
