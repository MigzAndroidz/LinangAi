// api/cron/check-reminders.js
// Vercel serverless function — triggered by GitHub Actions every 5 minutes.
// Checks all synced assignments against reminder thresholds and fires
// Web Push notifications via web-push + Upstash Redis.
//
// Security: requires header x-cron-secret matching CRON_SHARED_SECRET env var.

import { Redis } from '@upstash/redis';
import webpush from 'web-push';

// ─── VAPID Configuration ─────────────────────────────────────────────────────
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@linang.ai',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeRemaining(diffMs) {
  if (diffMs <= 0) return 'is past due';
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);

  if (days > 1) return `is due in ${days} days`;
  if (days === 1) return `is due tomorrow`;
  if (hours >= 1) return `is due in ${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  return `is due in ${minutes} minutes`;
}

/**
 * Check one profile's assignments for crossed reminder thresholds.
 * Returns an array of { assignment, offset } pairs that need notifications.
 */
async function getCrossedThresholds(profileId, assignments) {
  const crossed = [];
  const now = Date.now();

  for (const hw of assignments) {
    if (hw.status === 'completed') continue;

    const dueTime = new Date(hw.dueDate).getTime();
    const diffMs = dueTime - now;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    const offsets = hw.reminderOffsets || [1440, 180, 60, 15];

    // Load server-side notified-offsets for this assignment
    const notifiedKey = `push:notified:${hw.id}`;
    let alreadySent = [];
    try {
      const raw = await redis.get(notifiedKey);
      alreadySent = raw ? JSON.parse(raw) : [];
    } catch {
      alreadySent = [];
    }

    const notifiedSet = new Set(alreadySent);

    for (const offset of offsets) {
      // Same threshold logic as client-side checkReminders:
      // trigger when minutes remaining <= offset, not yet overdue by > 12 hours,
      // and this offset hasn't been notified yet for this assignment.
      if (diffMinutes <= offset && diffMinutes > -720 && !notifiedSet.has(offset)) {
        notifiedSet.add(offset);
        crossed.push({ hw, offset, notifiedSet, notifiedKey });
        break; // Only fire one notification per assignment per cron tick
      }
    }
  }

  return crossed;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Auth check
  const cronSecret = process.env.CRON_SHARED_SECRET;
  if (!cronSecret || req.headers['x-cron-secret'] !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const results = { checked: 0, sent: 0, errors: 0, skippedExpired: 0 };

  try {
    // 1. Scan all push:assignments:* keys
    let cursor = 0;
    const assignmentKeys = [];
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: 'push:assignments:*',
        count: 100
      });
      assignmentKeys.push(...keys);
      cursor = Number(nextCursor);
    } while (cursor !== 0);

    results.checked = assignmentKeys.length;

    // 2. Process each profile
    for (const key of assignmentKeys) {
      const profileId = key.replace('push:assignments:', '');

      // Load assignments
      let assignments = [];
      try {
        const raw = await redis.get(key);
        assignments = raw ? JSON.parse(raw) : [];
      } catch {
        continue;
      }

      if (assignments.length === 0) continue;

      // 3. Find crossed thresholds
      const crossed = await getCrossedThresholds(profileId, assignments);
      if (crossed.length === 0) continue;

      // 4. Load this profile's push subscription
      let subscription = null;
      try {
        const subRaw = await redis.get(`push:sub:${profileId}`);
        subscription = subRaw ? JSON.parse(subRaw) : null;
      } catch {
        continue;
      }

      if (!subscription) continue;

      // 5. Send push notifications
      for (const { hw, offset, notifiedSet, notifiedKey } of crossed) {
        const diffMs = new Date(hw.dueDate).getTime() - Date.now();
        const timeText = formatTimeRemaining(diffMs);
        const isOverdue = diffMs <= 0;

        const payload = JSON.stringify({
          title: isOverdue ? `⚠️ Overdue: ${hw.title}` : `⏰ ${hw.title}`,
          body: isOverdue
            ? 'Past due — make sure to submit your work!'
            : `${hw.title} ${timeText}.`,
          tag: `linang-${hw.id}-${offset}`,
          courseCode: hw.courseCode || ''
        });

        try {
          await webpush.sendNotification(subscription, payload);
          results.sent++;

          // Persist updated notified offsets
          await redis.set(
            notifiedKey,
            JSON.stringify(Array.from(notifiedSet)),
            { ex: 60 * 60 * 24 * 14 } // expire after 14 days
          );
        } catch (err) {
          // 404 / 410 = subscription expired — clean up
          if (err.statusCode === 404 || err.statusCode === 410) {
            await redis.del(`push:sub:${profileId}`);
            results.skippedExpired++;
          } else {
            console.error(`[check-reminders] Push failed for ${profileId}:`, err.message);
            results.errors++;
          }
        }
      }
    }
  } catch (err) {
    console.error('[check-reminders] Fatal error:', err);
    return res.status(500).json({ error: err.message, results });
  }

  return res.status(200).json({ ok: true, ...results });
}
