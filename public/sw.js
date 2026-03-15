// BailBot — Service Worker minimal
const CACHE_NAME = 'bailbot-cache-v1';
const CACHED_URLS = ['/dashboard', '/dashboard/multi'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHED_URLS).catch(() => {
        // Ignore errors if pages aren't available during install
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

/* ─── Push Notifications ─────────────────────────────────────────────────── */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'BailBot';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: { url: data.url || '/dashboard' },
      vibrate: [100, 50, 100],
      tag: 'bailbot-notification',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    /* silently ignore malformed push payloads */
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

/* ─── Fetch (Cache) ──────────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Network-first for API routes
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache-first for dashboard pages
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (
          response.ok &&
          (url.pathname === '/dashboard' || url.pathname === '/dashboard/multi')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
