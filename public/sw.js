// Zypsomart PWA Service Worker v6
const CACHE_NAME = 'zypsomart-v6';

// Essential application shell assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-maskable-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/favicon.ico',
  '/logo.png'
];

// Install: precache essential shell assets safely without failing on single asset errors
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response && (response.status === 200 || response.type === 'opaque')) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn(`[SW] Precache skipped for ${url}:`, err);
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up older caches & immediately claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for navigation, Stale-while-revalidate for local static assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Exclude external API calls, Firebase, Google Auth, Razorpay, and Cloud services
  if (
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith('/api') ||
    requestUrl.hostname.includes('firebase') ||
    requestUrl.hostname.includes('firestore') ||
    requestUrl.hostname.includes('googleapis') ||
    requestUrl.hostname.includes('google') ||
    requestUrl.hostname.includes('identitytoolkit') ||
    requestUrl.hostname.includes('securetoken') ||
    requestUrl.hostname.includes('razorpay')
  ) {
    return;
  }

  // Handle SPA navigation requests (network-first with cached index.html fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = (await caches.match('/index.html')) || (await caches.match('/'));
          if (cached) return cached;
          return new Response(
            '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Zypsomart Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:2rem;"><h2>Zypsomart</h2><p>You appear to be offline. Please reconnect to continue shopping.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Handle local static assets (Stale-while-revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
