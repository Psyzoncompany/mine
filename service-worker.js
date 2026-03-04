const CACHE_NAME = 'meucraft-v2';

const ESSENTIAL_ASSETS = [
  '/',
  '/minecraft.html',
  '/js/ui/UIBuilder.js',
  '/js/ui/hudManager.js',
  '/js/ui/inventoryUI.js',
  '/js/ui/mobileControls.js',
  '/js/ui/settingsManager.js',
  '/js/systems/SoundManager.js',
  '/js/world/WorldGenerator.js',
  '/manifest.webmanifest'
];

const STATIC_EXTENSIONS = /\.(js|css|html|svg|png|jpg|webmanifest)$/;

// Install: cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ESSENTIAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  if (STATIC_EXTENSIONS.test(request.url)) {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (!response || !response.ok) {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
            return response;
          });
        })
        .catch(() => {
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/minecraft.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
  } else {
    // Network-first strategy for everything else
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || !response.ok) {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request)
          .then((cached) => {
            if (cached) return cached;
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/minecraft.html');
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          })
        )
    );
  }
});
