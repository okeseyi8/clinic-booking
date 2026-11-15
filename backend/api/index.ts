import type { IncomingMessage, ServerResponse } from 'node:http';
import { pino } from 'pino';
import { loadEnv } from '../src/config/env.js';
import { connectDb } from '../src/config/db.js';
import { createApp } from '../src/app.js';

/**
 * Vercel entrypoint. `src/server.ts` is the long-running-server equivalent.
 *
 * Module scope runs once per warm instance, so the app and the Mongo connection
 * pool are reused across requests. Each request waits for the DB, and indexes,
 * to be ready. If connecting fails, the promise is cleared so the next request retries
 * instead of the instance failing forever.
 */
const env = loadEnv();
const logger = pino({ level: env.LOG_LEVEL });
const app = createApp(env, logger);

let ready: Promise<void> | undefined;
const ensureDb = () =>
  (ready ??= connectDb(env.MONGODB_URI).catch((err) => {
    ready = undefined;
    throw err;
  }));

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureDb();
  } catch (err) {
    logger.error({ err }, 'database connection failed');
    res.writeHead(503, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'database unavailable' }));
    return;
  }
  app(req, res);
}
