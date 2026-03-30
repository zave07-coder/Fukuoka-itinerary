// ========================================
// TRIP LOADING FOR MULTI-TRIP SYSTEM
// Load specific trip data from localStorage
// ========================================

let currentTrip = null;
let currentTripId = null;
const tripManager = new TripManager();

// Initialize trip loading on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTripViewer();
});

/**
 * Initialize trip viewer by loading trip from URL parameter
 */
function initializeTripViewer() {
    // Get trip ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentTripId = urlParams.get('trip');

    // Redirect to dashboard if no trip ID
    if (!currentTripId) {
        console.log('No trip ID found, redirecting to dashboard');
        window.location.href = 'dashboard.html';
        return;
    }

    // Load trip data
    loadTripData(currentTripId);
}

/**
 * Load trip data and update page
 * @param {string} tripId - Trip ID to load
 */
function loadTripData(tripId) {
    currentTrip = tripManager.getTrip(tripId);

    if (!currentTrip) {
        alert('Trip not found! Returning to dashboard.');
        window.location.href = 'dashboard.html';
        return;
    }

    // Update page metadata
    updatePageMetadata();

    // Render itinerary if days exist
    if (currentTrip.days && currentTrip.days.length > 0) {
        renderItinerary(currentTrip.days);
    } else {
        console.log('No itinerary data yet - user will build it');
    }
}

/**
 * Update page title and hero section with trip data
 */
function updatePageMetadata() {
    if (!currentTrip) return;

    // Update document title
    document.title = `${currentTrip.name} | WayWeave`;

    // Update hero section if it exists
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        heroTitle.textContent = currentTrip.name;
    }

    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        heroSubtitle.textContent = formatDateRange(currentTrip.startDate, currentTrip.endDate);
    }

    // Update navbar title if exists
    const navTitle = document.querySelector('.nav-title');
    if (navTitle) {
        navTitle.textContent = currentTrip.name;
    }
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

    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);

    if (!end || startDate === endDate) {
        return startStr;
    }

    const endStr = end.toLocaleDateString('en-US', options);
    return `${startStr} - ${endStr}`;
}

/**
 * Render itinerary days (placeholder - existing rendering logic will be used)
 * @param {Array} days - Array of day objects
 */
function renderItinerary(days) {
    console.log('Rendering itinerary with', days.length, 'days');
    // Existing rendering logic in the page will handle this
    // This function is a placeholder for future dynamic rendering
}

/**
 * Save current trip changes back to localStorage
 */
function saveTripChanges() {
    if (!currentTripId || !currentTrip) {
        console.error('No trip loaded to save');
        return;
    }

    // Extract current itinerary state from DOM
    const updatedDays = extractDaysFromDOM();

    // Update trip data
    tripManager.updateTrip(currentTripId, {
        days: updatedDays,
        updatedAt: new Date().toISOString()
    });

    console.log('Trip changes saved');
}

/**
 * Extract current day data from DOM (for saving edits)
 * @returns {Array} Array of day objects
 */
function extractDaysFromDOM() {
    // This will be implemented when we integrate with existing accordion system
    // For now, return the current trip's days
    return currentTrip?.days || [];
}

// ========================================
// EXISTING SCRIPT.JS CODE BELOW
// ========================================

// Navigation Toggle for Mobile
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    const isExpanded = navLinks.classList.toggle('active');
    // Update ARIA attribute for accessibility
    navToggle.setAttribute('aria-expanded', isExpanded);
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
    if (!currentTripId) {
        console.error('No trip loaded');
        return;
    }

    // Extract days from DOM
    const days = Array.from(dayCards).map(card => ({
        day: card.getAttribute('data-day'),
        tags: card.getAttribute('data-tags'),
        html: card.innerHTML
    }));

    // Update trip with new data
    tripManager.updateTrip(currentTripId, {
        days: days,
        updatedAt: new Date().toISOString()
    });

    alert('Itinerary saved!');
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
// Token loaded from config.js (window.MAPBOX_CONFIG)
const MAPBOX_TOKEN = window.MAPBOX_CONFIG?.token || null;

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
    // Ensure config is loaded before accessing token
    if (!window.MAPBOX_CONFIG || !window.MAPBOX_CONFIG.token) {
        console.error('Mapbox config not loaded. Retrying in 500ms...');
        setTimeout(initMap, 500);
        return;
    }

    mapboxgl.accessToken = window.MAPBOX_CONFIG.token;

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
    if (dayLocations.length > 1) {
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
    window.addEventListener('load', () => {
        initMap();
    });
}

// AI Chat functionality is now handled by split-screen-sync.js

// ========================================
// MOBILE BOTTOM NAVIGATION - ACTIVE STATE
// ========================================
function updateMobileNavActiveState() {
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const sections = document.querySelectorAll('main, section[id]');

    if (!mobileNavItems.length) return;

    // Function to check which section is in viewport
    function checkActiveSection() {
        const scrollPos = window.scrollY + 100; // Offset for navbar height

        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.id || section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                currentSection = sectionId;
            }
        });

        // Update active class on mobile nav items
        mobileNavItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === `#${currentSection}` ||
                (currentSection === 'main-content' && href === '#itinerary')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Throttle scroll event for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = window.requestAnimationFrame(() => {
            checkActiveSection();
        });
    }, { passive: true });

    // Initial check
    checkActiveSection();
}

// Initialize mobile nav when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateMobileNavActiveState);
} else {
    updateMobileNavActiveState();
}

// ========================================
// ACCESSIBILITY ENHANCEMENTS
// ========================================

// Keyboard navigation for accordion items
document.querySelectorAll('.accordion-header').forEach((header) => {
    // Make accordion keyboard accessible
    header.setAttribute('tabindex', '0');
    header.setAttribute('role', 'button');

    header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            header.click();
        }
    });
});

// Close mobile nav when clicking outside
document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('active')) {
        if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    }
});

// Close mobile nav on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus(); // Return focus to toggle button
    }
});

// Trap focus within mobile nav when open
navLinks.addEventListener('keydown', (e) => {
    if (!navLinks.classList.contains('active')) return;

    const focusableElements = navLinks.querySelectorAll('a, button');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }
});
