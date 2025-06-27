const CACHE_NAME = 'budget-tracker-v2' // Increment version to force cache update
const urlsToCache = [
  '/',
  '/manifest.json'
  // Remove specific assets to avoid caching issues during development
]

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Cache opened')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('SW: Cache installation failed:', error)
      })
  )
  self.skipWaiting()
})

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return
  }
  
  // Skip chrome-extension and other unsupported schemes
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.startsWith('moz-extension://') ||
      event.request.url.startsWith('ms-browser-extension://')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/')
            }
          })
      }
    )
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Background sync for offline expense submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  // Handle offline expense submissions here
  console.log('Background sync triggered')
}

// Push notifications (for future features)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New budget update available',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-96x96.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Budget Tracker', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
