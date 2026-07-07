import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { logger } from './utils/logger.js';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import walletRoutes from './modules/wallets/wallet.routes.js';
import sportsRoutes from './modules/sports/sports.routes.js';
import matchRoutes from './modules/matches/match.routes.js';
import oddsRoutes from './modules/odds/odds.routes.js';
import betRoutes from './modules/bets/bet.routes.js';
import promotionRoutes from './modules/promotions/promotion.routes.js';
import supportRoutes from './modules/support/support.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import cmsRoutes from './modules/cms/cms.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createApp(): Promise<Application> {
  const app = express();

  // ─── Security Headers ──────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // ─── CORS ─────────────────────────────────────────────────
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((o) => o.trim());

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
  }));

  // ─── Request Parsing ───────────────────────────────────────
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ─── Logging ──────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    }));
  }
  app.use(requestLogger);

  // ─── Rate Limiting ─────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10,
    message: { success: false, error: 'Too many auth attempts, please try again later' },
  });

  app.use('/api', globalLimiter);
  app.use('/api/auth', authLimiter);

  // ─── Health Check ──────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'WaliaBet API',
      version: process.env.APP_VERSION ?? '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ─── API Documentation ─────────────────────────────────────
  try {
    const swaggerDoc = JSON.parse(
      readFileSync(join(__dirname, '../docs/swagger.json'), 'utf-8')
    );
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
      customCss: '.swagger-ui .topbar { background: #0D1117; }',
      customSiteTitle: 'WaliaBet API Docs',
    }));
  } catch {
    logger.warn('Swagger docs not found — skipping API documentation');
  }

  // ─── Routes ────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/wallets', walletRoutes);
  app.use('/api/sports', sportsRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/odds', oddsRoutes);
  app.use('/api/bets', betRoutes);
  app.use('/api/promotions', promotionRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/cms', cmsRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/payments', paymentRoutes);

  // ─── Error Handling ────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
