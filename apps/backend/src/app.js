import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { globalLimiter } from './core/middlewares/rateLimiter.js';
import errorHandler from './core/middlewares/errorHandler.js';
import AppError from './core/utils/AppError.js';
import swaggerSpec from './core/config/swagger.js';

import authRoutes from './Features/Auth/auth.routes.js';

const app = express();

// ─── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} is not allowed.`));
      }
    },
    credentials: true, // required for HTTP-only cookie exchange
  })
);

// ─── Body & cookie parsers ─────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Health check (before rate limiter so probes are never throttled) ─────
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// ─── Global rate limiter ───────────────────────────────────────────────────
app.use(globalLimiter);

// ─── API docs (dev only) ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// ─── API routes ────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);

// ─── 404 handler ───────────────────────────────────────────────────────────
app.all('*', (req, _res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
});

// ─── Global error handler ─────────────────────────────────────────────────
app.use(errorHandler);

export default app;
