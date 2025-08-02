/**
 * Service Worker for Hook Line Studio
 * Provides offline capability, performance optimization, and caching strategies
 * Optimized for Core Web Vitals and conversion components
 */

const CACHE_NAME = 'hook-line-studio-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';
const IMAGES_CACHE = 'images-v1.0.0';
const API_CACHE = 'api-v1.0.0';

// Critical assets to cache immediately for fast LCP
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/components/ConversionHero.tsx',
  '/src/index.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700&display=swap'
];

// Assets to cache with stale-while-revalidate strategy
const DYNAMIC_ASSETS = [
  '/src/components/',
  '/src/lib/',
  '/src/hooks/',
  '/src/pages/',
  '/assets/'
];

// API endpoints to cache for offline functionality
const API_ENDPOINTS = [
  '/api/generate',
  '/api/analytics',
  '/api/health'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Cache critical assets for instant loading
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS.map(url => new Request(url, {
          cache: 'reload' // Bypass cache during install
        })));
      }),
      
      // Pre-cache conversion components
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Pre-caching conversion components');
        const conversionComponents = [
          '/src/components/InteractiveCTA.tsx',
          '/src/components/TrustSignals.tsx',
          '/src/components/UrgencyIndicators.tsx',
          '/src/components/StickyMicroCTA.tsx'
        ];
        return cache.addAll(conversionComponents.map(url => new Request(url)));
      })
    ]).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!Object.values({
              CACHE_NAME,
              STATIC_CACHE,
              DYNAMIC_CACHE,
              IMAGES_CACHE,
              API_CACHE
            }).includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different asset types with appropriate strategies
  if (isCriticalAsset(request.url)) {
    // Critical assets: Cache first with network fallback
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImageAsset(request.url)) {
    // Images: Cache first with network fallback, long TTL
    event.respondWith(cacheFirst(request, IMAGES_CACHE));
  } else if (isAPIRequest(request.url)) {
    // API requests: Network first with cache fallback
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (isDynamicAsset(request.url)) {
    // Dynamic assets: Stale while revalidate for performance
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  } else {
    // Default: Network first
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Background sync for analytics
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Push notifications for conversion optimization
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Hook Line Studio notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Hook Line Studio', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

/**
 * Caching Strategies
 */

// Cache first strategy - ideal for critical assets
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background for next time
      fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {}); // Silent fail
      
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first error:', error);
    
    // Return offline fallback for critical resources
    if (isCriticalAsset(request.url)) {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Network first strategy - ideal for API calls
async function networkFirst(request, cacheName, timeout = 3000) {
  try {
    const cache = await caches.open(cacheName);
    
    // Try network first with timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), timeout);
    });
    
    try {
      const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
      
      if (networkResponse.ok) {
        // Cache successful responses
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (networkError) {
      // Fallback to cache
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('[SW] Serving from cache due to network error');
        return cachedResponse;
      }
      
      throw networkError;
    }
  } catch (error) {
    console.error('[SW] Network first error:', error);
    throw error;
  }
}

// Stale while revalidate strategy - ideal for dynamic content
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Fetch from network to update cache
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => {}); // Silent fail
    
    // Return cached version immediately if available
    if (cachedResponse) {
      // Update cache in background
      fetchPromise;
      return cachedResponse;
    }
    
    // If no cache, wait for network
    return await fetchPromise || new Response('Not found', { status: 404 });
  } catch (error) {
    console.error('[SW] Stale while revalidate error:', error);
    throw error;
  }
}

/**
 * Helper Functions
 */

function isCriticalAsset(url) {
  return CRITICAL_ASSETS.some(asset => url.includes(asset)) ||
         url.includes('main.tsx') ||
         url.includes('App.tsx') ||
         url.includes('ConversionHero.tsx') ||
         url.includes('index.css') ||
         url.includes('fonts.googleapis.com');
}

function isImageAsset(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url) ||
         url.includes('/images/') ||
         url.includes('/assets/');
}

function isAPIRequest(url) {
  return url.includes('/api/') ||
         API_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

function isDynamicAsset(url) {
  return DYNAMIC_ASSETS.some(pattern => url.includes(pattern)) ||
         url.includes('/src/') ||
         url.includes('/components/') ||
         url.includes('/lib/') ||
         url.includes('/hooks/');
}

async function syncAnalytics() {
  try {
    console.log('[SW] Syncing analytics data');
    
    // Get stored analytics data
    const cache = await caches.open(API_CACHE);
    const storedData = await cache.match('/api/analytics/pending');
    
    if (storedData) {
      const data = await storedData.json();
      
      // Send to analytics service
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        // Clear stored data after successful sync
        await cache.delete('/api/analytics/pending');
        console.log('[SW] Analytics synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ cacheSize: size });
    });
  }
});

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const size = await response.clone().arrayBuffer();
        totalSize += size.byteLength;
      }
    }
  }
  
  return totalSize;
}

console.log('[SW] Service Worker loaded and ready');