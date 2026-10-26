import fs from 'node:fs';
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from './config.js';

// Lazy init so the server (and /api/health) can start before credentials are configured.
let db;
function init() {
  if (getApps().length) return;
  const credential = config.serviceAccountPath
    ? cert(JSON.parse(fs.readFileSync(config.serviceAccountPath, 'utf8')))
    : applicationDefault();
  initializeApp({ credential });
}

export function firestore() {
  if (!db) {
    init();
    db = getFirestore();
    db.settings({ ignoreUndefinedProperties: true });
  }
  return db;
}

export function adminAuth() {
  init();
  return getAuth();
}

export { FieldValue };
