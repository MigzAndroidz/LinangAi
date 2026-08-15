// api/push/sync-assignments.js
// Vercel serverless function — stores a profile's active assignments in Redis
// for the server-side cron reminder checker to read.
//
// POST { profileId: string, assignments: MinimalAssignment[] }
// MinimalAssignment: { id, title, courseCode, dueDate, reminderOffsets, status }

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { profileId, assignments } = req.body || {};

  if (!profileId || !Array.isArray(assignments)) {
    return res.status(400).json({ error: 'Missing profileId or assignments array' });
  }

  // Only keep the minimal fields — strip anything PII-heavy or unnecessary
  const minimal = assignments
    .filter((a) => a.status !== 'completed')
    .map((a) => ({
      id: a.id,
      title: a.title,
      courseCode: a.courseCode || '',
      dueDate: a.dueDate,
      reminderOffsets: a.reminderOffsets || [1440, 180, 60, 15],
      status: a.status
    }));

  try {
    // Overwrite the whole array for this profile
    await redis.set(`push:assignments:${profileId}`, JSON.stringify(minimal));
    return res.status(200).json({ success: true, count: minimal.length });
  } catch (err) {
    console.error('[sync-assignments] Redis error:', err);
    return res.status(500).json({ error: 'Redis write failed' });
  }
}
