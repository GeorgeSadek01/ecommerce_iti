/**
 * Single source of truth for environment configuration.
 *
 * Import this module instead of reading `process.env` directly in feature code.
 * Throws at startup if a required variable is missing, so misconfigured
 * deployments fail fast rather than silently.
 *
 * Usage:
 *   import env from '../../core/config/env.js';
 *   const secret = env.JWT_SECRET;
 */

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const optional = (key, defaultValue = '') => process.env[key] ?? defaultValue;

// Parses an optional numeric env var; falls back to defaultValue if unset or blank.
const optionalNumber = (key, defaultValue) => {
  const raw = process.env[key];
  if (!raw || raw.trim() === '') return defaultValue;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

const requiredInProd = (key) => {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable in production: ${key}`);
  }
  return value || '';
};

const env = {
  // ─── App ───────────────────────────────────────────────────────────────
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: optionalNumber('PORT', 4000),

  // ─── Database ──────────────────────────────────────────────────────────
  MONGO_URI: required('MONGO_URI'),

  // ─── JWT / Auth ────────────────────────────────────────────────────────
  JWT_SECRET: required('JWT_SECRET'),

  // ─── Frontend ──────────────────────────────────────────────────────────
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:4200'),

  // ─── SMTP ──────────────────────────────────────────────────────────────
  SMTP_HOST: optional('SMTP_HOST'),
  SMTP_PORT: optionalNumber('SMTP_PORT', 587),
  SMTP_USER: optional('SMTP_USER'),
  SMTP_PASS: optional('SMTP_PASS'),
  DEFAULT_FROM_EMAIL: optional('DEFAULT_FROM_EMAIL', 'no-reply@example.com'),

  // ─── Cloudinary ────────────────────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: optional('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: optional('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: optional('CLOUDINARY_API_SECRET'),

  // ─── Stripe ────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: optional('STRIPE_SECRET_KEY'),
  STRIPE_PUBLISHABLE_KEY: optional('STRIPE_PUBLISHABLE_KEY'),
  STRIPE_WEBHOOK_KEY: requiredInProd('STRIPE_WEBHOOK_KEY'),
  CLIENT_URL_SUCCESS_PAYMENT: optional('CLIENT_URL_SUCCESS_PAYMENT', `${optional('FRONTEND_URL', 'http://localhost:4200')}/success.html`),
  CLIENT_URL_FAILURE_PAYMENT: optional('CLIENT_URL_FAILURE_PAYMENT', `${optional('FRONTEND_URL', 'http://localhost:4200')}/failure.html`),

  // ─── Google OAuth ──────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID: optional('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: optional('GOOGLE_CLIENT_SECRET'),

  get isProd() {
    return this.NODE_ENV === 'production';
  },
  get isDev() {
    return this.NODE_ENV === 'development';
  },
};

export default env;
