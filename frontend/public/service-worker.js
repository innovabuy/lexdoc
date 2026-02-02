const CACHE_NAME = 'lexdoc-client-v1.0.0';
const OFFLINE_URL = '/extranet/offline';

// Files to cache immediately
const STATIC_CACHE = [
  '/extranet/login',
  '/extranet/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_CACHE).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );

  // Force immediate activation
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control immediately
  self.clients.claim();
});

// Fetch strategy: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (let them fail naturally)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip chrome-extension and other non-http(s)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // Fallback to cache if offline
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, show offline page
        if (request.destination === 'document') {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }
        }

        // Return a basic offline response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = { title: 'LexDoc Client', body: 'Nouveau document disponible' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.warn('[SW] Failed to parse push data:', e);
  }

  const options = {
    body: data.body || 'Nouveau document disponible',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      documentId: data.documentId,
      url: data.url || '/extranet/dashboard'
    },
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ],
    tag: data.tag || 'lexdoc-notification',
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'LexDoc Client', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/extranet/dashboard';

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Check if there's already a window open
          for (const client of windowClients) {
            if (client.url.includes('/extranet/') && 'focus' in client) {
              client.navigate(urlToOpen);
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-documents') {
    event.waitUntil(syncDocuments());
  }
});

async function syncDocuments() {
  try {
    // Get stored token from IndexedDB or send without auth
    const response = await fetch('/api/extranet/documents?limit=10');

    if (response.ok) {
      const data = await response.json();

      // Update cache with fresh data
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/api/extranet/documents', new Response(JSON.stringify(data)));

      console.log('[SW] Documents synced successfully');
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Message handler for communication with the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
