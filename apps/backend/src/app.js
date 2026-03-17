import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { globalLimiter } from './core/middlewares/rateLimiter.js';
import errorHandler from './core/middlewares/errorHandler.js';
import AppError from './core/utils/AppError.js';
import swaggerSpec from './core/config/swagger.js';
import authenticate from './core/middlewares/authenticate.js';
import authorize from './core/utils/authorize.js';

// Import routes
import authRoutes from './features/auth/auth.routes.js';
import categoryRoutes from './features/categories/categories.routes.js';
import productRoutes from './features/products/product.routes.js';
import paymentRoutes from './features/payment/payment.routes.js';
import cartRoutes from './features/cart/cart.routes.js';
import orderRoutes from './features/orders/orders.routes.js';
// import adminPanelRoutes from './features/adminPanel/adminPanel.routes.js';
import sellerPanelRoutes from './features/sellerPanel/sellerPanel.routes.js';
import promoCodeRoutes from './features/promoCode/promoCode.routes.js';

import { webhook } from './features/payment/Controllers/payment.controller.js';

const app = express();

// webhook must be before all routes
app.post('/api/v1/payment/webhook', express.raw({ type: 'application/json' }), webhook);

// ─── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:4200').split(',').map((o) => o.trim());

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
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/cart', authenticate, cartRoutes);
app.use('/api/v1/orders', authenticate, orderRoutes);
// app.use('/api/v1/admin', authenticate, authorize('admin'), adminPanelRoutes);
app.use('/api/v1/seller', authenticate, authorize('seller', 'admin'), sellerPanelRoutes);
app.use('/api/v1/promo-codes', promoCodeRoutes);

// ─── 404 handler ───────────────────────────────────────────────────────────
app.all('*any', (req, _res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
});

// ─── Global error handler ─────────────────────────────────────────────────
app.use(errorHandler);

export default app;
