const CACHE_NAME = 'tap-to-win-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/user-login.html',
  '/admin-login.html',
  '/user-game.html',
  '/admin-dashboard.html'
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
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event to Serve Cached Files or Fallback to Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      // Avoid caching requests for "favicon.ico"
      if (event.request.url.endsWith('favicon.ico')) {
        return fetch(event.request);
      }

      return fetch(event.request).catch(error => {
        console.error('Fetch failed:', error);
        throw error;
      });
    })
  );
});
