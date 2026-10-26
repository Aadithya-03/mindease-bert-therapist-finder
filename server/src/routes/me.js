import { Router } from 'express';
import { asyncHandler } from '../middleware/auth.js';
import { firestore, FieldValue } from '../firebase.js';

const router = Router();
const MOODS = ['terrible', 'bad', 'neutral', 'good', 'great'];
const iso = (t) => (t?.toDate ? t.toDate().toISOString() : null);
const userDoc = (uid) => firestore().collection('users').doc(uid);

router.post('/mood', asyncHandler(async (req, res) => {
  const { mood } = req.body || {};
  if (!MOODS.includes(mood)) return res.status(400).json({ error: 'Unknown mood.' });
  await userDoc(req.user.uid).collection('moods').add({ mood, createdAt: FieldValue.serverTimestamp() });
  res.json({ ok: true });
}));

router.get('/dashboard', asyncHandler(async (req, res) => {
  const u = userDoc(req.user.uid);
  const [a, m, s] = await Promise.all([
    u.collection('assessments').orderBy('createdAt', 'desc').limit(10).get(),
    u.collection('moods').orderBy('createdAt', 'desc').limit(30).get(),
    u.collection('sessions').orderBy('updatedAt', 'desc').limit(10).get(),
  ]);
  const map = (snap) => snap.docs.map((d) => {
    const x = d.data();
    return { id: d.id, ...x, createdAt: iso(x.createdAt), updatedAt: iso(x.updatedAt) };
  });
  res.json({ assessments: map(a), moods: map(m), sessions: map(s) });
}));

/** Permanently deletes everything stored for the signed-in user. */
router.delete('/me/data', asyncHandler(async (req, res) => {
  await firestore().recursiveDelete(userDoc(req.user.uid));
  res.json({ ok: true });
}));

export default router;
