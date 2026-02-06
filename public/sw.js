const CACHE_NAME = 'babynum-time-v4.0';
const urlsToCache = [
    '/',
    '/manifest.json',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) return;

    // Strategy for Navigation (HTML): Network First
    // This ensures the user always gets the latest version of the app shell (index.html)
    // If network fails, it falls back to the cached version.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Update cache with new version
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                })
                .catch(() => {
                    // Return cached page or offline page if network fails
                    return caches.match(event.request)
                        .then((response) => {
                            return response || caches.match('/');
                        });
                })
        );
        return;
    }

    // Strategy for Assets (JS, CSS, Images): Stale-While-Revalidate
    // Serve from cache immediately, then update cache in background
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Fetch from network to update cache
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed, nothing to update
                    });

                // Return cached response if available, otherwise wait for network
                return cachedResponse || fetchPromise;
            })
    );
});
