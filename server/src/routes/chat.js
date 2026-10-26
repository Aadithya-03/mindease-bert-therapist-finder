import { Router } from 'express';
import { asyncHandler } from '../middleware/auth.js';
import { firestore, FieldValue } from '../firebase.js';
import { analyze, slim } from '../services/ml.js';
import { generateReply } from '../services/chat.js';
import { isCrisis, CRISIS_REPLY } from '../services/safety.js';

const router = Router();
const KINDS = ['chatbot', 'therapist', 'voice'];
const ID_RE = /^[A-Za-z0-9]{10,40}$/;
const iso = (t) => (t?.toDate ? t.toDate().toISOString() : null);
const sessionsOf = (uid) => firestore().collection('users').doc(uid).collection('sessions');

/** POST /api/chat { message, sessionId?, kind } */
router.post('/', asyncHandler(async (req, res) => {
  const { message, sessionId, kind = 'chatbot' } = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > 2000)
    return res.status(400).json({ error: 'Message must be 1 to 2000 characters.' });
  if (!KINDS.includes(kind)) return res.status(400).json({ error: 'Unknown chat kind.' });
  if (sessionId !== undefined && sessionId !== null && !ID_RE.test(sessionId))
    return res.status(400).json({ error: 'Invalid session.' });

  const text = message.trim();
  const sessions = sessionsOf(req.user.uid);
  const ref = sessionId ? sessions.doc(sessionId) : sessions.doc();
  let prior = 0;
  let history = [];

  if (sessionId) {
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Conversation not found.' });
    prior = snap.data().userMessageCount || 0;
    const msgs = await ref.collection('messages').orderBy('createdAt', 'desc').limit(12).get();
    history = msgs.docs.map((d) => d.data()).reverse().map((m) => ({ role: m.role, text: m.text }));
  }

  // 1. BERT reads the mood of this message (chat still works if the ML service is down).
  let analysis = null;
  try { analysis = await analyze(text); } catch (err) { console.warn('ML unavailable:', err.message); }

  // 2. Reply: safety message on crisis, otherwise LLM / rule engine.
  const crisis = isCrisis(text) || analysis?.severity === 'crisis';
  const { reply, source } = crisis ? { reply: CRISIS_REPLY, source: 'safety' } : await generateReply({ history, message: text, analysis });

  // 3. Every 3rd user message, ask BERT about the recent conversation as a whole.
  const count = prior + 1;
  let sessionAssessment = null;
  if (analysis && count >= 3 && count % 3 === 0) {
    const recent = history.filter((m) => m.role === 'user').slice(-4).map((m) => m.text);
    try { sessionAssessment = await analyze([...recent, text].join('. ')); } catch { /* optional */ }
  }

  // 4. Persist.
  const userAt = new Date();
  const botAt = new Date(userAt.getTime() + 1);
  const batch = firestore().batch();
  batch.set(ref, {
    kind, updatedAt: userAt, lastMessage: text.slice(0, 80),
    userMessageCount: FieldValue.increment(1), messageCount: FieldValue.increment(2),
    ...(sessionId ? {} : { title: text.slice(0, 60), createdAt: userAt }),
  }, { merge: true });
  batch.set(ref.collection('messages').doc(), { role: 'user', text, createdAt: userAt, emotion: analysis?.label || null });
  batch.set(ref.collection('messages').doc(), { role: 'bot', text: reply, createdAt: botAt, source });
  if (sessionAssessment) {
    batch.set(firestore().collection('users').doc(req.user.uid).collection('assessments').doc(), {
      source: 'chat', sessionId: ref.id, label: sessionAssessment.label, confidence: sessionAssessment.confidence,
      distress_score: sessionAssessment.distress_score, severity: sessionAssessment.severity,
      needs_therapist: sessionAssessment.needs_therapist, createdAt: botAt,
    });
  }
  await batch.commit();

  res.json({ sessionId: ref.id, reply, source, crisis, analysis: slim(analysis), sessionAssessment });
}));

router.get('/sessions', asyncHandler(async (req, res) => {
  const snap = await sessionsOf(req.user.uid).orderBy('updatedAt', 'desc').limit(30).get();
  const kind = req.query.kind;
  const sessions = snap.docs
    .map((d) => ({ id: d.id, ...d.data(), createdAt: iso(d.data().createdAt), updatedAt: iso(d.data().updatedAt) }))
    .filter((s) => !kind || s.kind === kind);
  res.json({ sessions });
}));

router.get('/sessions/:id/messages', asyncHandler(async (req, res) => {
  if (!ID_RE.test(req.params.id)) return res.status(400).json({ error: 'Invalid session.' });
  const ref = sessionsOf(req.user.uid).doc(req.params.id);
  if (!(await ref.get()).exists) return res.status(404).json({ error: 'Conversation not found.' });
  const snap = await ref.collection('messages').orderBy('createdAt', 'asc').limit(200).get();
  res.json({ messages: snap.docs.map((d) => ({ id: d.id, role: d.data().role, text: d.data().text, time: iso(d.data().createdAt) })) });
}));

router.delete('/sessions/:id', asyncHandler(async (req, res) => {
  if (!ID_RE.test(req.params.id)) return res.status(400).json({ error: 'Invalid session.' });
  await firestore().recursiveDelete(sessionsOf(req.user.uid).doc(req.params.id));
  res.json({ ok: true });
}));

export default router;
