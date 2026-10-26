import { Router } from 'express';
import { asyncHandler } from '../middleware/auth.js';
import { firestore, FieldValue } from '../firebase.js';
import { analyze } from '../services/ml.js';

const router = Router();
const score = (v) => (v === undefined || v === null ? undefined : Number.isInteger(v) && v >= 0 && v <= 6 ? v : NaN);

/** POST /api/analyze  { text, screening?: { phq2, gad2 } } -> BERT result + therapist decision */
router.post('/', asyncHandler(async (req, res) => {
  const { text, screening } = req.body || {};
  if (typeof text !== 'string' || text.trim().length < 10 || text.length > 5000)
    return res.status(400).json({ error: 'Please write at least a sentence or two (10 to 5000 characters).' });

  let scr;
  if (screening) {
    const phq2 = score(screening.phq2), gad2 = score(screening.gad2);
    if (Number.isNaN(phq2) || Number.isNaN(gad2)) return res.status(400).json({ error: 'Invalid questionnaire scores.' });
    scr = { phq2, gad2 };
  }

  const result = await analyze(text.trim(), scr);

  // Privacy: store the outcome, not what the person wrote.
  const ref = await firestore().collection('users').doc(req.user.uid).collection('assessments').add({
    source: 'mind-check',
    label: result.label, confidence: result.confidence, distress_score: result.distress_score,
    severity: result.severity, needs_therapist: result.needs_therapist,
    screening: result.screening || null, createdAt: FieldValue.serverTimestamp(),
  });
  res.json({ id: ref.id, result });
}));

export default router;
