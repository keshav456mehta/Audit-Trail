require('dotenv').config({ quiet: true });
const crypto = require('node:crypto');

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set in production');
  }
  // Dev/test only: a random per-process secret (tokens die on restart).
  jwtSecret = crypto.randomBytes(32).toString('hex');
}
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

module.exports = Object.freeze({
  env,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/audit-trail',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  projectionPollMs: Number(process.env.PROJECTION_POLL_MS) || 2000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 300,
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  trustProxy: process.env.TRUST_PROXY === 'true' ? 1 : false,
});
