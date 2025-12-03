// Service Worker for aggressive 3D model caching
// Optimized for mobile and slow connections

const CACHE_NAME = '3d-models-v1';
const MODEL_CACHE_NAME = '3d-models-assets-v1';

// Files to cache immediately
const PRECACHE_URLS = [
  '/',
  '/models.json',
];

// Install event - precache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== MODEL_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Strategy for 3D models (.glb files)
  if (url.pathname.endsWith('.glb')) {
    event.respondWith(
      cacheFirstWithNetworkFallback(request, MODEL_CACHE_NAME)
    );
    return;
  }
  
  // Strategy for images and textures
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp)$/)) {
    event.respondWith(
      cacheFirstWithNetworkFallback(request, MODEL_CACHE_NAME)
    );
    return;
  }
  
  // Strategy for API calls - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstWithCacheFallback(request, CACHE_NAME)
    );
    return;
  }
  
  // Default strategy - network first for HTML, cache first for others
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstWithCacheFallback(request, CACHE_NAME)
    );
  } else {
    event.respondWith(
      cacheFirstWithNetworkFallback(request, CACHE_NAME)
    );
  }
});

// Cache-first strategy (best for static assets like models)
async function cacheFirstWithNetworkFallback(request, cacheName) {
  try {
    // Try cache first
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      
      // Update cache in background (stale-while-revalidate)
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      }).catch(() => {
        // Ignore network errors during background update
      });
      
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    console.log('[SW] Cache miss, fetching:', request.url);
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // Try to return cached version as last resort
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response('Network error', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Network-first strategy (best for dynamic content)
async function networkFirstWithCacheFallback(request, cacheName) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available
    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
