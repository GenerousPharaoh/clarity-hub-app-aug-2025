// Service Worker for Clarity Hub
const CACHE_NAME = 'clarity-hub-v2';

// Assets to cache on install (critical files)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/robots.txt'
];

// Files to cache separately with their own strategy
const PDF_CACHE_NAME = 'clarity-hub-pdf-v1';
const PDF_ASSETS = [
  '/pdf/pdf.worker.min.js'
];

// Installation event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to ensure the service worker activates immediately
  self.skipWaiting();
  
  // Precache core assets individually to prevent one failure from failing all
  event.waitUntil(
    Promise.all([
      // Cache main assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Precaching core app assets');
        
        // Cache each asset individually
        return Promise.allSettled(
          PRECACHE_ASSETS.map(asset => 
            fetch(asset)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${asset}`);
                }
                return cache.put(asset, response);
              })
              .catch(error => {
                console.warn(`[Service Worker] Failed to cache ${asset}:`, error);
                // Continue despite failure
                return Promise.resolve();
              })
          )
        );
      }),
      
      // Cache PDF assets separately
      caches.open(PDF_CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Precaching PDF assets');
        
        // Cache each PDF asset individually
        return Promise.allSettled(
          PDF_ASSETS.map(asset => 
            fetch(asset)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${asset}`);
                }
                return cache.put(asset, response);
              })
              .catch(error => {
                console.warn(`[Service Worker] Failed to cache ${asset}:`, error);
                // Continue despite failure
                return Promise.resolve();
              })
          )
        );
      })
    ])
  );
});

// Activation event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete outdated caches but keep our current ones
          if (cacheName !== CACHE_NAME && cacheName !== PDF_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  
  // Ensure the service worker takes control immediately
  return self.clients.claim();
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Special handling for PDF assets
  if (event.request.url.includes('/pdf/')) {
    event.respondWith(
      caches.open(PDF_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          
          // Network fetch with cache update
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((error) => {
              console.error('[Service Worker] PDF fetch failed:', error);
              // Return a fallback response or throw
              throw error;
            });
        });
      })
    );
    return;
  }
  
  // Standard cache-first strategy for other assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        
        // Network fetch with cache update
        return fetch(event.request)
          .then((networkResponse) => {
            // Only cache successful responses for same-origin requests
            if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
              // Exclude API calls and dynamic content from caching
              if (!event.request.url.includes('/api/') && 
                  !event.request.url.includes('/storage/') &&
                  !event.request.url.includes('/functions/')) {
                cache.put(event.request, networkResponse.clone());
              }
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // For HTML requests, return the offline page if available
            if (event.request.mode === 'navigate') {
              return cache.match('/');
            }
            
            // Otherwise, propagate the error
            throw error;
          });
      });
    })
  );
});

// Handle errors
self.addEventListener('error', (event) => {
  console.error('[Service Worker] Error:', event.error);
});

// Message handler (for debugging and control)
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  } else if (event.tag === 'sync-files') {
    event.waitUntil(syncFiles());
  }
});

// Sync forms data when back online
const syncForms = async () => {
  try {
    // Get queued form submissions from IndexedDB
    const db = await openDatabase();
    const formDataToSync = await db.getAll('formQueue');
    
    // Process each form submission
    const syncPromises = formDataToSync.map(async (formData) => {
      try {
        // Attempt to submit the form data
        const response = await fetch(formData.url, {
          method: formData.method,
          headers: formData.headers,
          body: formData.body
        });
        
        if (response.ok) {
          // If successful, remove from queue
          await db.delete('formQueue', formData.id);
          return { success: true, id: formData.id };
        }
        
        return { success: false, id: formData.id, error: 'Server error' };
      } catch (error) {
        return { success: false, id: formData.id, error: error.message };
      }
    });
    
    // Wait for all sync attempts to complete
    return Promise.all(syncPromises);
  } catch (error) {
    console.error('[Service Worker] Error syncing forms:', error);
    return Promise.reject(error);
  }
};

// Sync files when back online
const syncFiles = async () => {
  try {
    // Similar to syncForms but for file uploads
    const db = await openDatabase();
    const filesToSync = await db.getAll('fileQueue');
    
    const syncPromises = filesToSync.map(async (fileData) => {
      try {
        // Reconstruct the file from stored data
        const file = new File([fileData.blob], fileData.filename, {
          type: fileData.contentType
        });
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);
        Object.entries(fileData.metadata || {}).forEach(([key, value]) => {
          formData.append(key, value);
        });
        
        // Attempt to upload
        const response = await fetch(fileData.url, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          // If successful, remove from queue
          await db.delete('fileQueue', fileData.id);
          return { success: true, id: fileData.id };
        }
        
        return { success: false, id: fileData.id, error: 'Server error' };
      } catch (error) {
        return { success: false, id: fileData.id, error: error.message };
      }
    });
    
    return Promise.all(syncPromises);
  } catch (error) {
    console.error('[Service Worker] Error syncing files:', error);
    return Promise.reject(error);
  }
};

// Helper function to open IndexedDB
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('offlineSync', 1);
    
    dbRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for offline sync
      if (!db.objectStoreNames.contains('formQueue')) {
        db.createObjectStore('formQueue', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('fileQueue')) {
        db.createObjectStore('fileQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      resolve({
        getAll: (storeName) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        delete: (storeName, id) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
      });
    };
    
    dbRequest.onerror = (event) => {
      reject(new Error('Failed to open database'));
    };
  });
};

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    
    // Display the notification
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        data: data.data || {},
        actions: data.actions || [],
        tag: data.tag || 'default-tag',
      })
    );
  } catch (error) {
    console.error('[Service Worker] Error displaying notification:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle notification click by opening a window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window already exists, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window exists, open a new one
      return clients.openWindow('/');
    })
  );
});

// Skip waiting message
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 