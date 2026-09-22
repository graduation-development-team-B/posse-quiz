const ASSET_CACHE_PREFIX = 'posse-quiz-app-assets-';
const ASSET_CACHE_NAME = `${ASSET_CACHE_PREFIX}v1`;
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];
const STATIC_DESTINATIONS = new Set(['document', 'script', 'style', 'image', 'font', 'manifest', 'worker']);

function isStaticAssetRequest(request) {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;

  // Content_API and application data are deliberately outside this cache.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/content/') ||
    url.pathname.startsWith('/progress/')
  ) {
    return false;
  }

  return request.mode === 'navigate' || STATIC_DESTINATIONS.has(request.destination);
}

async function cacheResponse(request, response) {
  if (!response || !response.ok) return response;
  const cache = await caches.open(ASSET_CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    return await cacheResponse(request, await fetch(request));
  } catch (error) {
    const cache = await caches.open(ASSET_CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await cache.match('/');
      if (shell) return shell;
    }
    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(ASSET_CACHE_NAME);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) await cache.put(url, response);
          } catch {
            // A later navigation can populate this asset when the network is available.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith(ASSET_CACHE_PREFIX) && name !== ASSET_CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  if (!isStaticAssetRequest(event.request)) return;
  event.respondWith(networkFirst(event.request));
});
