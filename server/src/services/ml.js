import { config } from '../config.js';

/** Calls the Python BERT service. Throws if it is unreachable or errors. */
export async function analyze(text, screening) {
  let res;
  try {
    res = await fetch(`${config.mlUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, screening: screening || undefined }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    const e = new Error('The BERT service is not reachable. Start it with: cd ml && uvicorn app:app --port 8000');
    e.status = 503;
    throw e;
  }
  if (!res.ok) {
    const e = new Error(`BERT service returned ${res.status}`);
    e.status = res.status === 422 ? 400 : 502;
    throw e;
  }
  return res.json();
}

/** Fields the client needs for a single chat message. */
export const slim = (a) =>
  a && { label: a.label, confidence: a.confidence, distress_score: a.distress_score, severity: a.severity, needs_therapist: a.needs_therapist };
