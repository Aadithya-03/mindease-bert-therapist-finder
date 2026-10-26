import { Router } from 'express';
import { asyncHandler } from '../middleware/auth.js';
import { searchNearby, geocode } from '../services/places.js';

const router = Router();

router.get('/search', asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat), lng = Number(req.query.lng), radius = Number(req.query.radius ?? 10);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
    return res.status(400).json({ error: 'Valid lat and lng are required.' });
  if (!Number.isFinite(radius) || radius < 1 || radius > 50)
    return res.status(400).json({ error: 'radius must be between 1 and 50 km.' });
  res.json({ results: await searchNearby(lat, lng, radius) });
}));

router.get('/geocode', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2 || q.length > 200) return res.status(400).json({ error: 'Enter an address or city.' });
  const hit = await geocode(q);
  if (!hit) return res.status(404).json({ error: 'No place found for that search.' });
  res.json(hit);
}));

export default router;
