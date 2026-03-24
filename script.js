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
