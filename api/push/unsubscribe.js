// api/push/unsubscribe.js
// Vercel serverless function — removes a stored Web Push subscription.
// POST { profileId: string }

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { profileId } = req.body || {};
  if (!profileId) return res.status(400).json({ error: 'Missing profileId' });

  try {
    await redis.del(`push:sub:${profileId}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[unsubscribe] Redis error:', err);
    return res.status(500).json({ error: 'Redis delete failed' });
  }
}
