/**
 * Service Worker - Wahgola PWA
 * Provides offline support and smart caching
 */

const CACHE_VERSION = 'v1.3.0';
const CACHE_NAME = `wahgola-${CACHE_VERSION}`;

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/trip-planner.html',
  '/login.html',
  '/dashboard.css',
  '/dashboard.js',
  '/trip-planner.css',
  '/trip-planner.js',
  '/booking.css',
  '/booking-service.js',
  '/feature-flags.js',
  '/mobile.css',
  '/config.js',
  '/auth-service.js',
  '/sync-service.js',
  '/trip-manager.js',
  '/poi-image-service.js',
  '/storage-monitor.js',
  '/auth-prompt.js',
  '/templates.html',
  '/templates.js',
  '/manifest.json'
];

// Runtime caching patterns
const CACHE_STRATEGIES = {
  // Cache first (for static assets)
  cacheFirst: ['css', 'js', 'woff', 'woff2', 'ttf', 'eot'],

  // Network first (for HTML, API calls)
  networkFirst: ['html', 'json'],

  // Stale while revalidate (for images)
  staleWhileRevalidate: ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp']
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('wahgola-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch event - intelligent caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (except CDNs)
  if (url.origin !== location.origin && !isTrustedCDN(url.origin)) {
    return;
  }

  // Determine caching strategy based on file type
  const strategy = getCachingStrategy(url.pathname);

  event.respondWith(
    handleRequest(request, strategy)
  );
});

/**
 * Handle request with appropriate caching strategy
 */
async function handleRequest(request, strategy) {
  const url = new URL(request.url);

  // API calls - always network first with fallback
  if (url.pathname.startsWith('/api/')) {
    return networkFirst(request, { timeout: 5000 });
  }

  // HTML pages - network first with cache fallback
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    return networkFirst(request, { timeout: 3000 });
  }

  // Apply strategy based on file type
  switch (strategy) {
    case 'cacheFirst':
      return cacheFirst(request);

    case 'networkFirst':
      return networkFirst(request);

    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request);

    default:
      return networkFirst(request);
  }
}

/**
 * Cache First strategy (best for static assets)
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline - Resource not cached', { status: 503 });
  }
}

/**
 * Network First strategy (best for HTML and API)
 */
async function networkFirst(request, options = {}) {
  const { timeout = 3000 } = options;

  try {
    // Race between network and timeout
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), timeout)
      )
    ]);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(getOfflinePage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale While Revalidate (best for images)
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Return cached version immediately if available
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

/**
 * Get caching strategy for a URL
 */
function getCachingStrategy(pathname) {
  const extension = pathname.split('.').pop()?.toLowerCase();

  for (const [strategy, extensions] of Object.entries(CACHE_STRATEGIES)) {
    if (extensions.includes(extension)) {
      return strategy;
    }
  }

  return 'networkFirst'; // Default
}

/**
 * Check if origin is a trusted CDN
 */
function isTrustedCDN(origin) {
  const trustedCDNs = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'api.mapbox.com'
  ];

  return trustedCDNs.some(cdn => origin.includes(cdn));
}

/**
 * Offline page HTML
 */
function getOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Wahgola</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: white;
          text-align: center;
          padding: 2rem;
        }
        .offline-container {
          max-width: 500px;
        }
        .offline-icon {
          font-size: 5rem;
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        p {
          font-size: 1.125rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          line-height: 1.6;
        }
        .retry-btn {
          display: inline-block;
          padding: 0.875rem 2rem;
          background: white;
          color: #667eea;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .retry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        .offline-tip {
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.875rem;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1>You're Offline</h1>
        <p>
          It looks like you've lost your internet connection.
          Don't worry - your saved trips are still available!
        </p>
        <a href="/" class="retry-btn" onclick="location.reload()">
          Try Again
        </a>
        <div class="offline-tip">
          💡 <strong>Tip:</strong> Once you go back online, your trips will automatically sync.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(urls);
    });
  }
});

/**
 * Background sync event (for future)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-trips') {
    event.waitUntil(syncTrips());
  }
});

/**
 * Sync trips in background
 */
async function syncTrips() {
  console.log('[SW] Background sync: Syncing trips...');

  try {
    // This will be implemented when background sync is enabled
    // For now, just log
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error;
  }
}

console.log('[SW] Service worker loaded');
