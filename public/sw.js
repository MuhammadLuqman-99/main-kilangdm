// Service Worker for KilangDM Dashboard PWA
// Provides offline functionality and caching

const CACHE_NAME = 'kilangdm-dashboard-v3.0';
const STATIC_CACHE = 'kilangdm-static-v3.0';
const DYNAMIC_CACHE = 'kilangdm-dynamic-v3.0';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/dashboard.html',
  '/dashboardbo.html', 
  '/ecommerce.html',
  '/marketing.html',
  '/salesteam.html',
  '/followup.html',
  '/index.html',
  '/manifest.json',
  
  // CSS Files
  '/style/unified-theme.css',
  '/style/responsive.css',
  '/style/professional-charts.css',
  '/style/professional-order-dashboard.css',
  '/style/style.css',
  '/style/improvements.css',
  '/style/enhanced-dashboard.css',
  '/style/dashboard-advanced-filter.css',
  
  // JavaScript Files
  '/js/dashboard.js',
  '/js/dashboard-ui.js',
  '/js/dashboard-advanced-filter.js',
  '/js/dashboard-enhancements.js',
  '/js/professional-charts-config.js',
  '/js/professional-order-dashboard.js',
  '/js/responsive-enhancements.js',
  '/js/export-manager.js',
  '/js/notification-system.js',
  '/js/improvements.js',
  '/js/ready-sync.js',
  
  // External Dependencies (when available)
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Network-first resources (always try to get fresh data)
const NETWORK_FIRST = [
  '/api/',
  'firebase',
  'firestore'
];

// Cache-first resources (use cached version if available)
const CACHE_FIRST = [
  '/style/',
  '/js/',
  '/icons/',
  'fonts.googleapis.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Install event');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES.filter(url => !url.startsWith('http')));
      })
      .then(() => {
        console.log('✅ Service Worker: Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Error caching static files:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activate event');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('kilangdm-') && 
                     cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE;
            })
            .map(cacheName => {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Old caches cleaned');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extensions and other protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Handle different caching strategies based on URL patterns
  if (isNetworkFirst(event.request.url)) {
    event.respondWith(networkFirstStrategy(event.request));
  } else if (isCacheFirst(event.request.url)) {
    event.respondWith(cacheFirstStrategy(event.request));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(event.request));
  }
});

// Network-first strategy (try network, fallback to cache)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response for future use
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    return await caches.match(request) || createOfflineResponse(request);
    
  } catch (error) {
    console.log('📡 Service Worker: Network failed, trying cache for:', request.url);
    return await caches.match(request) || createOfflineResponse(request);
  }
}

// Cache-first strategy (try cache, fallback to network)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('📡 Service Worker: Cache and network failed for:', request.url);
    return createOfflineResponse(request);
  }
}

// Stale-while-revalidate strategy (return cache, update in background)
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Start fetch in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  // Return cached version immediately, or wait for network
  return cachedResponse || fetchPromise.catch(() => createOfflineResponse(request));
}

// Helper functions
function isNetworkFirst(url) {
  return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

function isCacheFirst(url) {
  return CACHE_FIRST.some(pattern => url.includes(pattern));
}

function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Return offline page for HTML requests
  if (request.headers.get('accept').includes('text/html')) {
    return new Response(`
      <!DOCTYPE html>
      <html lang="ms">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KilangDM - Offline</title>
        <style>
          body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: #e2e8f0;
            text-align: center;
            padding: 2rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .offline-container {
            max-width: 400px;
            padding: 2rem;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }
          .offline-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            color: #3b82f6;
          }
          h1 { color: #60a5fa; margin-bottom: 1rem; }
          p { color: #94a3b8; line-height: 1.6; }
          .retry-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 1rem;
            font-weight: 600;
          }
          .retry-btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1>Offline Mode</h1>
          <p>Anda sedang offline. Beberapa features mungkin tidak tersedia.</p>
          <p>Dashboard akan sync semula bila connection pulih.</p>
          <button class="retry-btn" onclick="window.location.reload()">
            Try Again
          </button>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // Return empty response for other requests
  return new Response('', { 
    status: 408,
    statusText: 'Request Timeout (Offline)' 
  });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'background-sync-dashboard') {
    event.waitUntil(syncDashboardData());
  }
});

async function syncDashboardData() {
  try {
    console.log('📊 Service Worker: Syncing dashboard data');
    
    // Get any offline actions stored in IndexedDB
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action from offline storage
        await removeOfflineAction(action.id);
        console.log('✅ Service Worker: Synced offline action:', action.id);
        
      } catch (error) {
        console.log('❌ Service Worker: Failed to sync action:', action.id, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Background sync failed:', error);
  }
}

// Placeholder functions for offline storage (would integrate with IndexedDB)
async function getOfflineActions() {
  return []; // TODO: Implement IndexedDB storage
}

async function removeOfflineAction(id) {
  // TODO: Implement IndexedDB removal
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('📲 Service Worker: Push notification received');
  
  const options = {
    body: 'You have new dashboard updates!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore', title: 'View Dashboard',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close', title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('KilangDM Dashboard', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard.html')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open dashboard
    event.waitUntil(
      clients.openWindow('/dashboard.html')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', event => {
  // Only log meaningful messages, filter out object spam
  if (event.data && event.data.type) {
    console.log('💬 Service Worker: Message received:', event.data.type);
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCache(event.data.urls));
  }
});

async function updateCache(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('📦 Service Worker: Updated cache for:', url);
      }
    } catch (error) {
      console.log('❌ Service Worker: Failed to update cache for:', url, error);
    }
  }
}

console.log('🚀 Service Worker: Loaded and ready');