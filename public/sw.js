// Self-destroying service worker to instantly purge obsolete cache and unregister
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    })
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Pass-through all fetch requests directly to network without caching
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

