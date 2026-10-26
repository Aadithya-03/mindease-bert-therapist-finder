import { adminAuth } from '../firebase.js';

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Verifies the Firebase ID token sent by the React app and sets req.user. */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Please sign in.' });

  let auth;
  try {
    auth = adminAuth();
  } catch (err) {
    console.error('Firebase Admin is not configured:', err.message);
    return res.status(500).json({ error: 'Server is not connected to Firebase. Check FIREBASE_SERVICE_ACCOUNT in server/.env.' });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}
