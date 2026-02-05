/**
 * OnGoing PWA Service Worker
 * Provides offline capability and caching for the app
 */

// Bump version to force clients to refresh cached assets
const CACHE_VERSION = 'v2';
const CACHE_NAME = `ongoing-runtime-${CACHE_VERSION}`;
const STATIC_CACHE = `ongoing-static-${CACHE_VERSION}`;

// Static assets to cache immediately
// Cache only truly static assets. Do NOT cache app routes (HTML) to avoid
// serving stale builds after deployments.
const STATIC_ASSETS = ['/', '/manifest.json', '/favicon.svg', '/apple-touch-icon.png'];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('[SW] Some assets failed to cache:', err);
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Never cache navigations (HTML). This prevents stale app code after deploys.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/').then((cachedResponse) => cachedResponse || new Response('Offline', { status: 503 }));
      })
    );
    return;
  }

  event.respondWith(
    // Try network first
    fetch(request)
      .then((response) => {
        // Cache static assets (scripts/styles/images/fonts). Avoid caching HTML.
        const dest = request.destination;
        const isCacheableAsset = dest === 'script' || dest === 'style' || dest === 'image' || dest === 'font';

        if (response.status === 200) {
          if (isCacheableAsset) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'OnGoing', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

