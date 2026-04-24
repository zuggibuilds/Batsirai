import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import providersRoutes from './routes/providers';
import categoryRoutes from './routes/categories';
import bookingRoutes from './routes/bookings';
import paymentRoutes, { paymentsWebhookHandler } from './routes/payments';
import reviewRoutes from './routes/reviews';
import notificationRoutes from './routes/notifications';
import searchRoutes from './routes/search';
import adminRoutes from './routes/admin';
import { errorHandler } from './middlewares/errorHandler';
import { adminAuthRateLimiter, apiRateLimiter, authRateLimiter, searchRateLimiter } from './middlewares/rateLimit';
import { verifyFlutterwaveWebhook } from './middlewares/verifyFlutterwaveWebhook';
import { adminIpAllowlist } from './middlewares/adminIpAllowlist';
import { sensitiveRouteLogger } from './middlewares/sensitiveRouteLogger';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());

  // Webhook route must consume raw body and validate signature before JSON parsing.
  app.post(
    '/api/payments/webhook',
    sensitiveRouteLogger,
    express.raw({ type: 'application/json' }),
    verifyFlutterwaveWebhook,
    paymentsWebhookHandler,
  );

  app.use(express.json({ limit: '2mb' }));
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.info(`${req.method} ${req.originalUrl}`);
    next();
  });

  app.use('/api/auth', sensitiveRouteLogger, authRateLimiter, authRoutes);
  app.use('/api/admin', adminIpAllowlist);
  app.use('/api/admin/auth', sensitiveRouteLogger, adminAuthRateLimiter);
  app.use('/api', apiRateLimiter);

  app.use('/api/users', usersRoutes);
  app.use('/api/providers', providersRoutes);
  app.use('/api', categoryRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/search', searchRateLimiter, searchRoutes);
  app.use('/api/admin', adminRoutes);

  const openapi = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Batsirai API',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:4000' }],
    },
    apis: [],
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);

  return app;
}
