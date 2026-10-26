import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mlUrl: (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, ''),
  serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT || '',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5',
  osmUserAgent: process.env.OSM_USER_AGENT || 'MindEase/1.0 (set OSM_USER_AGENT with a contact email)',
};
