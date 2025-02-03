const CACHE_NAME = 'tap-to-win-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/user-login.html',
  '/admin-login.html',
  '/user-game.html',
  '/admin-dashboard.html',
  '/register-user.html',
  '/view-withdrawals.html',
  '/view-purchase-requests.html',
  '/view-registered-users.html'
];

// Install Service Worker and Cache Files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch(error => console.error('Failed to cache:', error))
  );
});

// Activate and Clean Up Old Caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch and Serve Cached Files
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cached file
        }
        return fetch(event.request); // Fetch from network if not cached
      })
      .catch(error => console.error('Fetch failed:', error))
  );
});
