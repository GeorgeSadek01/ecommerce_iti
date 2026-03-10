import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter: 100 requests per minute per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests. Please try again later.' },
});

/**
 * Stricter limiter for auth endpoints: 10 requests per minute per IP.
 * Applied to all /auth/* routes to slow brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many auth attempts. Please wait and try again.' },
});
