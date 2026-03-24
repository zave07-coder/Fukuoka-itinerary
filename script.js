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

// ===== INTERACTIVE MAP WITH MAPBOX =====
let MAPBOX_TOKEN = null;

// Fetch Mapbox token from API
async function loadMapboxToken() {
    try {
        const response = await fetch('/api/mapbox-token');
        const data = await response.json();

        if (data.error) {
            alert('Mapbox not configured. Please add MAPBOX_TOKEN environment variable to Cloudflare Pages.');
            return null;
        }

        MAPBOX_TOKEN = data.token;
        return MAPBOX_TOKEN;
    } catch (error) {
        console.error('Error loading Mapbox token:', error);
        alert('Failed to load map. Please refresh the page.');
        return null;
    }
}

const locations = [
    { name: "Fukuoka Airport", lat: 33.5859, lng: 130.4509, type: "airport", day: 1, order: 1 },
    { name: "Hakata Station", lat: 33.5904, lng: 130.4206, type: "transport", day: 1, order: 2 },
    { name: "Canal City Hakata", lat: 33.5897, lng: 130.4086, type: "shopping", day: 1, order: 3 },
    { name: "Ohori Park", lat: 33.5844, lng: 130.3789, type: "park", day: 2, order: 1 },
    { name: "Fukuoka Castle Ruins", lat: 33.5850, lng: 130.3805, type: "cultural", day: 2, order: 2 },
    { name: "Momochi Seaside Park", lat: 33.5936, lng: 130.3583, type: "beach", day: 2, order: 3 },
    { name: "Fukuoka Tower", lat: 33.5936, lng: 130.3580, type: "attraction", day: 2, order: 4 },
    { name: "Marine World Uminonakamichi", lat: 33.6533, lng: 130.4044, type: "aquarium", day: 3, order: 1 },
    { name: "Uminonakamichi Seaside Park", lat: 33.6569, lng: 130.4133, type: "park", day: 3, order: 2 },
    { name: "Dazaifu Tenmangu Shrine", lat: 33.5227, lng: 130.5334, type: "shrine", day: 4, order: 1 },
    { name: "Kyushu National Museum", lat: 33.5239, lng: 130.5361, type: "museum", day: 4, order: 2 },
    { name: "Beppu Onsens", lat: 33.2845, lng: 131.4910, type: "onsen", day: 5, order: 1 },
    { name: "Yufuin", lat: 33.2648, lng: 131.3633, type: "town", day: 6, order: 1 },
    { name: "Karatsu Castle", lat: 33.4516, lng: 129.9686, type: "castle", day: 7, order: 1 },
    { name: "Nijinomatsubara Pine Forest", lat: 33.4347, lng: 129.9742, type: "nature", day: 7, order: 2 },
    { name: "Nokonoshima Island", lat: 33.6144, lng: 130.2806, type: "island", day: 8, order: 1 },
    { name: "Tenjin Shopping District", lat: 33.5908, lng: 130.3993, type: "shopping", day: 9, order: 1 },
    { name: "Kushida Shrine", lat: 33.5952, lng: 130.4120, type: "shrine", day: 9, order: 2 },
    { name: "Fukuoka Airport", lat: 33.5859, lng: 130.4509, type: "airport", day: 10, order: 1 }
];

let map;
let markers = [];
let currentRoute = null;
let selectedDay = 'all';

function initMap() {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Initialize Mapbox map with satellite streets for better POI visibility
    map = new mapboxgl.Map({
        container: 'interactiveMap',
        style: 'mapbox://styles/mapbox/streets-v12', // Streets with POIs
        center: [130.4017, 33.5904], // Fukuoka center [lng, lat]
        zoom: 10,
        pitch: 45, // 3D tilt
        bearing: 0
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add geolocation control
    map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
    }), 'top-right');

    // Wait for map to load
    map.on('load', () => {
        // Enable POI labels
        map.setLayoutProperty('poi-label', 'visibility', 'visible');

        // Add markers for all locations
        addMarkersToMap();

        // Add route selector control
        addDaySelector();

        // Show all routes by default
        showRouteForDay('all');
    });
}

function addMarkersToMap() {
    locations.forEach((location, index) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-mapbox-marker';
        el.innerHTML = getMarkerEmoji(location.type);
        el.style.fontSize = '28px';
        el.style.cursor = 'pointer';
        el.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

        // Create popup
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                <div style="text-align: center; padding: 0.8rem; min-width: 150px;">
                    <div style="font-size: 24px; margin-bottom: 0.5rem;">${getMarkerEmoji(location.type)}</div>
                    <strong style="font-size: 1.1rem;">${location.name}</strong><br>
                    <span style="color: #666; font-size: 0.9rem;">Day ${location.day} - Stop ${location.order}</span><br>
                    <span style="background: #e3f2fd; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.85rem; margin-top: 0.5rem; display: inline-block;">
                        ${location.type.toUpperCase()}
                    </span>
                </div>
            `);

        // Add marker to map
        const marker = new mapboxgl.Marker(el)
            .setLngLat([location.lng, location.lat])
            .setPopup(popup)
            .addTo(map);

        markers.push({ marker, location, element: el });
    });
}

function getMarkerEmoji(type) {
    const emojiMap = {
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
    return emojiMap[type] || '📍';
}

function addDaySelector() {
    // Create custom control for day selection
    const container = document.createElement('div');
    container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group day-selector';
    container.style.cssText = `
        background: white;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        max-width: 200px;
    `;

    const title = document.createElement('div');
    title.innerHTML = '<strong>📍 Show Route</strong>';
    title.style.marginBottom = '8px';
    container.appendChild(title);

    const select = document.createElement('select');
    select.style.cssText = 'width: 100%; padding: 5px; border-radius: 4px; border: 1px solid #ddd;';
    select.innerHTML = `
        <option value="all">All Days</option>
        <option value="1">Day 1: Arrival</option>
        <option value="2">Day 2: Fukuoka City</option>
        <option value="3">Day 3: Aquarium</option>
        <option value="4">Day 4: Dazaifu</option>
        <option value="5">Day 5: Beppu</option>
        <option value="6">Day 6: Yufuin</option>
        <option value="7">Day 7: Karatsu</option>
        <option value="8">Day 8: Island</option>
        <option value="9">Day 9: Shopping</option>
        <option value="10">Day 10: Departure</option>
    `;

    select.addEventListener('change', (e) => {
        showRouteForDay(e.target.value);
    });

    container.appendChild(select);

    // Add to map
    map.getContainer().appendChild(container);
    container.style.position = 'absolute';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.zIndex = '1';
}

function showRouteForDay(day) {
    selectedDay = day;

    // Remove existing route
    if (currentRoute && map.getLayer('route')) {
        map.removeLayer('route');
        map.removeSource('route');
        currentRoute = null;
    }

    // Filter locations by day
    let dayLocations;
    if (day === 'all') {
        // Show all locations
        dayLocations = locations;
        markers.forEach(m => m.element.style.opacity = '1');
    } else {
        const dayNum = parseInt(day);
        dayLocations = locations.filter(l => l.day === dayNum);

        // Update marker opacity
        markers.forEach(m => {
            m.element.style.opacity = m.location.day === dayNum ? '1' : '0.3';
        });
    }

    // Draw route if we have multiple locations
    if (dayLocations.length > 1 && day !== 'all') {
        drawRoute(dayLocations);
    }

    // Fit map to show all selected locations
    if (dayLocations.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        dayLocations.forEach(loc => {
            bounds.extend([loc.lng, loc.lat]);
        });
        map.fitBounds(bounds, { padding: 80, maxZoom: 13 });
    }
}

async function drawRoute(locations) {
    if (locations.length < 2) return;

    // Sort locations by order
    const sorted = [...locations].sort((a, b) => a.order - b.order);

    // Create coordinates string for Mapbox Directions API
    const coordinates = sorted.map(l => `${l.lng},${l.lat}`).join(';');

    try {
        // Call Mapbox Directions API for driving route
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
        );

        const data = await response.json();

        if (data.routes && data.routes[0]) {
            const route = data.routes[0].geometry;

            // Add route to map
            map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: route
                }
            });

            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3887be',
                    'line-width': 5,
                    'line-opacity': 0.75
                }
            });

            currentRoute = route;
        }
    } catch (error) {
        console.error('Error drawing route:', error);
    }
}

// Initialize map when page loads
if (document.getElementById('interactiveMap')) {
    window.addEventListener('load', async () => {
        await loadMapboxToken();
        initMap();
    });
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
