import { pino } from 'pino';
import { loadEnv } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { createApp } from './app.js';

const env = loadEnv();
const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development' && { transport: { target: 'pino-pretty' } }),
});

await connectDb(env.MONGODB_URI);
const server = createApp(env, logger).listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'clinic booking API listening');
});

/**
 * Graceful shutdown: on deploy/scale-down the platform sends SIGTERM. Stop accepting
 * connections, let in-flight requests finish, close the DB pool, exit. Force-exit
 * after 10s so a stuck request can't block the deploy.
 */
function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down');
  setTimeout(() => process.exit(1), 10_000).unref();
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
