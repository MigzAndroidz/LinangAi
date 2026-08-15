// src/services/pushService.js
// Client-side Web Push subscription management for Linang AI.

const SW_PATH = '/sw.js';
const SUBSCRIBE_API = '/api/push/subscribe';
const UNSUBSCRIBE_API = '/api/push/unsubscribe';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a base64url VAPID public key string to a Uint8Array
 * as required by pushManager.subscribe({ applicationServerKey }).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Registers (or returns the already-registered) service worker.
 */
async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }
  // If already registered, return it
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_PATH);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Registers the SW, requests permission, subscribes to push,
 * then POSTs the subscription to /api/push/subscribe.
 *
 * @param {string} profileId  The active Linang AI profile ID.
 * @returns {{ ok: boolean, reason?: string }}
 */
export async function subscribeToPush(profileId) {
  try {
    // 1. Browser support checks
    if (!('PushManager' in window)) {
      return { ok: false, reason: 'push_unsupported' };
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('[pushService] VITE_VAPID_PUBLIC_KEY is not set — skipping push subscription.');
      return { ok: false, reason: 'no_vapid_key' };
    }

    // 2. Ensure SW is registered
    const registration = await getServiceWorkerRegistration();

    // 3. Request / verify notification permission
    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

    if (permission !== 'granted') {
      return { ok: false, reason: 'permission_denied' };
    }

    // 4. Subscribe via PushManager
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // 5. POST subscription to our Vercel API
    const res = await fetch(SUBSCRIBE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, subscription: subscription.toJSON() })
    });

    if (!res.ok) {
      console.warn('[pushService] Server rejected subscription:', await res.text());
      return { ok: false, reason: 'server_error' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[pushService] subscribeToPush error:', err);
    return { ok: false, reason: err.message };
  }
}

/**
 * Unsubscribes from push and notifies the server to remove the stored
 * subscription for this profileId.
 *
 * @param {string} profileId
 */
export async function unsubscribeFromPush(profileId) {
  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }

    // Best-effort server-side cleanup
    fetch(UNSUBSCRIBE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId })
    }).catch(() => {});
  } catch (err) {
    console.warn('[pushService] unsubscribeFromPush error:', err);
  }
}

/**
 * Registers the service worker on app boot (call once from main.jsx).
 * Does not subscribe — subscription happens only after permission is granted.
 */
export async function registerServiceWorker() {
  try {
    await getServiceWorkerRegistration();
  } catch (err) {
    console.warn('[pushService] SW registration failed:', err);
  }
}
