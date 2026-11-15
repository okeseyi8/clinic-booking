import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { Env } from './config/env.js';
import { isDbReady } from './config/db.js';
import { requireApiKey } from './middleware/api-key.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { slotRoutes } from './modules/slots/slot.routes.js';
import { bookingRoutes } from './modules/bookings/booking.routes.js';
import { resetRoutes } from './modules/reset/reset.routes.js';

/** Builds the Express app. No network or DB side effects, so tests can import it directly. */
export function createApp(env: Pick<Env, 'API_KEY' | 'CORS_ORIGIN'>, logger: Logger) {
  const app = express();

  app.set('trust proxy', 1); // behind Render's load balancer: trust its X-Forwarded-* headers
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, exposedHeaders: ['Retry-After', 'Idempotent-Replayed', 'X-Request-Id'] }));
  app.use(express.json({ limit: '10kb' }));

  // Liveness/readiness for the platform. Outside the spec, so no API key.
  app.get('/health', (_req, res) => {
    const ready = isDbReady();
    res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' });
  });

  app.use(requireApiKey(env.API_KEY));
  app.use('/slots', slotRoutes);
  app.use('/bookings', bookingRoutes);
  app.use('/reset', resetRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
