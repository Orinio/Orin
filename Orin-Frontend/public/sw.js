// Orin Push Notification Service Worker
// Handles push events and displays lock screen notifications

const CACHE_NAME = 'orin-v1';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push event - display notification on lock screen
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'Orin',
      body: event.data.text(),
      icon: '/fevicon.ico',
      badge: '/fevicon.ico',
    };
  }

  const title = payload.title || 'Orin';
  const options = {
    body: payload.body || 'You have a new notification',
    icon: payload.icon || '/fevicon.ico',
    badge: payload.badge || '/fevicon.ico',
    image: payload.image,
    tag: payload.tag || 'orin-notification',
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/dashboard',
      notificationId: payload.notificationId,
      type: payload.type,
      timestamp: Date.now(),
    },
    actions: payload.actions || [
      { action: 'open', title: 'Open Orin' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: payload.requireInteraction || false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click - open the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close - track dismissal
self.addEventListener('notificationclose', (event) => {
  // Optional: track notification dismissals
});

// Push subscription change - re-register
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      // Notify the server about the new subscription
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
    })
  );
});
