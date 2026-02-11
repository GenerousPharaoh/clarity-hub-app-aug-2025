// Self-destructing service worker — clears all caches and unregisters itself.
// This replaces the old caching service worker that was serving stale content.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => caches.delete(name)))
    ).then(() => self.clients.claim()).then(() => {
      // Unregister this service worker
      self.registration.unregister();
    })
  );
});
