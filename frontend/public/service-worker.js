// This service worker enables the app to work offline and be installable as a PWA

const CACHE_NAME = 'stayfit-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logofit.png',
  '/favicon.ico'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch with network-first strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignore unsupported schemes (e.g. chrome-extension://) to avoid Cache API errors.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // Skip service worker entirely for API calls, non-GET requests, or external domains
  if (
    event.request.method !== 'GET' || 
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('localhost') && url.port === '4000'
  ) {
    return; // Don't handle these requests at all
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});
