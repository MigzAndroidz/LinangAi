// public/sw.js — Linang AI Service Worker for Web Push Notifications
// This file is served from the root so it has full-scope access.

const APP_ORIGIN = self.location.origin;

// ─── Push Event ─────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Linang AI', body: event.data?.text() || 'You have a reminder.' };
  }

  const { title = 'Linang AI Reminder', body = '', tag = 'linang-reminder', courseCode = '' } = data;

  const options = {
    body: body,
    icon: '/mascot.png',
    badge: '/mascot.png',
    tag: tag,                  // deduplicates: same tag replaces existing notification
    renotify: true,
    requireInteraction: false,
    data: { url: APP_ORIGIN },
    actions: [
      { action: 'open', title: '📚 Open Linang AI' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  if (courseCode) {
    options.body = `[${courseCode}] ${body}`;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Notification Click ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || APP_ORIGIN;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing open tab if found
      for (const client of windowClients) {
        if (client.url.startsWith(APP_ORIGIN) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Activate: claim all clients immediately ─────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
