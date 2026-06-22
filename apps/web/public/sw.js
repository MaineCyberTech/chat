const CACHE_NAME = "chat-platform-v1";
const STATIC_ASSETS = ["/", "/manifest.webmanifest"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - network first for API, cache first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (except for fonts, images)
  if (url.origin !== location.origin && !request.destination.match(/font|image/)) {
    return;
  }

  // API routes - network first, no caching
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/socket.io/")) {
    event.respondWith(fetch(request).catch(() => new Response("Offline", { status: 503 })));
    return;
  }

  // Static assets - cache first
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "manifest"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // HTML pages - network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
  );
});

// Message event - handle skip waiting and client communication
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});

// Push event - handle push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "New message",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: true,
    tag: data.tag || "chat-notification",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title || "Chat Platform", options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "reply") {
    // Handle reply action
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
    return;
  }

  // Default click - open app
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(event.notification.data.url || "/") && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(event.notification.data.url || "/");
    }),
  );
});

// Notification close event
self.addEventListener("notificationclose", (event) => {
  // Could track dismissal analytics here
  console.log("Notification closed:", event.notification.tag);
});
