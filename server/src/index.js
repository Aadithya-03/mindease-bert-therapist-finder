import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import chatRoutes from './routes/chat.js';
import analyzeRoutes from './routes/analyze.js';
import placesRoutes from './routes/places.js';
import meRoutes from './routes/me.js';

const app = express();

app.use(helmet({
  // Applies when Express serves the built React app (production). Adjust if you add new third-party hosts.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://apis.google.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org', 'https://*.googleusercontent.com'],
      connectSrc: ["'self'", 'https://identitytoolkit.googleapis.com', 'https://securetoken.googleapis.com', 'https://www.googleapis.com'],
      frameSrc: ["'self'", 'https://*.firebaseapp.com', 'https://accounts.google.com', 'https://apis.google.com'],
    },
  },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // needed for Google sign-in popup
}));
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const perUser = (max) => rateLimit({ windowMs: 60_000, max, keyGenerator: (req) => req.user.uid, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down for a minute.' } });

app.use('/api', requireAuth);
app.use('/api/chat', perUser(30), chatRoutes);
app.use('/api/analyze', perUser(10), analyzeRoutes);
app.use('/api/places', perUser(30), placesRoutes);
app.use('/api', perUser(120), meRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Serve the built React app in production.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(dist, 'index.html')) : next()));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong on the server.' });
});

app.listen(config.port, () => console.log(`MindEase API on http://localhost:${config.port}`));
