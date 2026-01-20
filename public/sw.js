/**
 * CUBE Nexum - Service Worker
 * 
 * Enterprise-grade PWA capabilities:
 * - Offline caching strategies
 * - Push notification handling
 * - Background sync
 * - Periodic sync
 * - Cache management
 */

const CACHE_NAME = 'cube-nexum-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
];

// API routes to cache
const API_CACHE_ROUTES = [
  '/api/autofill/profiles',
  '/api/passwords/vault',
  '/api/workflows/list',
  '/api/settings',
];

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  api: 5 * 60 * 1000, // 5 minutes
  images: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// ============================================================================
// INSTALL EVENT
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// ============================================================================
// ACTIVATE EVENT
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  
  // Take control immediately
  self.clients.claim();
});

// ============================================================================
// FETCH EVENT
// ============================================================================

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(event.request));
    return;
  }
  
  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstWithNetwork(event.request));
    return;
  }
  
  // Handle navigation (pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(event.request));
    return;
  }
  
  // Default: network first
  event.respondWith(networkFirstWithCache(event.request));
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Cache first, fallback to network
 * Best for: Static assets (CSS, JS, images)
 */
async function cacheFirstWithNetwork(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetchAndCache(request);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network first, fallback to cache
 * Best for: API requests, dynamic content
 */
async function networkFirstWithCache(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Network first with offline fallback page
 * Best for: Navigation requests
 */
async function networkFirstWithFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return cache.match(OFFLINE_URL);
  }
}

/**
 * Fetch and update cache in background
 */
async function fetchAndCache(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse);
  } catch (error) {
    // Ignore fetch errors in background update
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'CUBE Nexum',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    timestamp: data.timestamp || Date.now(),
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  // Handle action buttons
  if (action) {
    handleNotificationAction(action, data);
    return;
  }
  
  // Default: open app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      const url = data?.url || '/';
      return clients.openWindow(url);
    })
  );
});

function handleNotificationAction(action, data) {
  switch (action) {
    case 'view':
      clients.openWindow(data?.url || '/');
      break;
    case 'dismiss':
      // Just close notification (already done)
      break;
    case 'reply':
      clients.openWindow(data?.replyUrl || '/chat');
      break;
    default:
      console.log('[SW] Unknown action:', action);
  }
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  switch (event.tag) {
    case 'sync-workflows':
      event.waitUntil(syncWorkflows());
      break;
    case 'sync-autofill':
      event.waitUntil(syncAutofill());
      break;
    case 'sync-analytics':
      event.waitUntil(syncAnalytics());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

async function syncWorkflows() {
  try {
    const db = await openIndexedDB();
    const pendingWorkflows = await getFromStore(db, 'pending-workflows');
    
    for (const workflow of pendingWorkflows) {
      await fetch('/api/workflows/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
      await deleteFromStore(db, 'pending-workflows', workflow.id);
    }
  } catch (error) {
    console.error('[SW] Workflow sync failed:', error);
    throw error; // Retry later
  }
}

async function syncAutofill() {
  try {
    const db = await openIndexedDB();
    const pendingProfiles = await getFromStore(db, 'pending-autofill');
    
    for (const profile of pendingProfiles) {
      await fetch('/api/autofill/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      await deleteFromStore(db, 'pending-autofill', profile.id);
    }
  } catch (error) {
    console.error('[SW] Autofill sync failed:', error);
    throw error;
  }
}

async function syncAnalytics() {
  try {
    const db = await openIndexedDB();
    const pendingEvents = await getFromStore(db, 'pending-analytics');
    
    if (pendingEvents.length > 0) {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingEvents }),
      });
      await clearStore(db, 'pending-analytics');
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
    throw error;
  }
}

// ============================================================================
// PERIODIC SYNC
// ============================================================================

self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  switch (event.tag) {
    case 'check-updates':
      event.waitUntil(checkForUpdates());
      break;
    case 'refresh-cache':
      event.waitUntil(refreshCache());
      break;
  }
});

async function checkForUpdates() {
  try {
    const response = await fetch('/api/version');
    const { version } = await response.json();
    
    // Compare with cached version
    const cache = await caches.open(CACHE_NAME);
    const cachedVersion = await cache.match('/api/version');
    
    if (cachedVersion) {
      const { version: cached } = await cachedVersion.json();
      if (version !== cached) {
        // New version available
        self.registration.showNotification('Update Available', {
          body: 'A new version of CUBE Nexum is available. Click to update.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'update',
          actions: [
            { action: 'update', title: 'Update Now' },
            { action: 'later', title: 'Later' },
          ],
        });
      }
    }
    
    cache.put('/api/version', response);
  } catch (error) {
    console.error('[SW] Update check failed:', error);
  }
}

async function refreshCache() {
  const cache = await caches.open(CACHE_NAME);
  
  // Refresh precached assets
  for (const url of PRECACHE_ASSETS) {
    try {
      const response = await fetch(url);
      cache.put(url, response);
    } catch (error) {
      // Skip failed assets
    }
  }
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(event.data.urls));
      break;
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCache());
      break;
    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      }));
      break;
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(urls);
}

async function clearAllCache() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
}

async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// ============================================================================
// HELPERS
// ============================================================================

function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot'
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// IndexedDB helpers for background sync
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cube-nexum-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-workflows')) {
        db.createObjectStore('pending-workflows', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-autofill')) {
        db.createObjectStore('pending-autofill', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-analytics')) {
        db.createObjectStore('pending-analytics', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function clearStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[SW] Service Worker loaded');
