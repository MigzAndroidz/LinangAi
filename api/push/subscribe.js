// api/push/subscribe.js
// Vercel serverless function — stores a Web Push subscription in Upstash Redis.
// POST { profileId: string, subscription: PushSubscriptionJSON }

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN
});

export default async function handler(req, res) {
  // Allow OPTIONS pre-flight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { profileId, subscription } = req.body || {};

  if (!profileId || !subscription?.endpoint) {
    return res.status(400).json({ error: 'Missing profileId or subscription' });
  }

  try {
    await redis.set(`push:sub:${profileId}`, JSON.stringify(subscription));
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[subscribe] Redis error:', err);
    return res.status(500).json({ error: 'Redis write failed' });
  }
}
