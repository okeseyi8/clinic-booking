import { setTimeout as sleep } from 'node:timers/promises';
import type { RequestHandler, Response } from 'express';
import { IdempotencyKey } from '../models/idempotency-key.model.js';
import { HttpError, badRequest, conflict } from '../lib/http-error.js';
import { stableHash } from '../lib/stable-hash.js';
import { isDuplicateKeyError } from '../lib/mongo.js';

const TTL_MS = 24 * 60 * 60 * 1000; // how long a key is remembered
const STALE_LOCK_MS = 30_000; // an in-progress key older than this belongs to a crashed request
const WAIT_FOR_ORIGINAL_MS = 5_000; // how long a concurrent retry waits for the first request to finish
const POLL_MS = 50;

type StoredResponse = { statusCode: number; body: unknown };

/**
 * Level 4: `Idempotency-Key` support.
 *
 * - First request with a key atomically claims it (insert on unique `_id`), runs
 *   normally, and its final response is stored before being sent.
 * - Same key + same body  → the stored response is replayed (same status, same booking id).
 * - Same key + different body → 422.
 * - Same key while the first request is still running → wait briefly, then replay.
 *
 * Responses that are worth retrying (429, 5xx) are NOT stored: the key is released
 * so the client's retry gets a real second chance. Everything else is final.
 */
export function idempotency(): RequestHandler {
  return async (req, res, next) => {
    const key = req.get('Idempotency-Key');
    if (key === undefined) return next();
    if (key.trim() === '' || key.length > 255) {
      throw badRequest('Idempotency-Key must be between 1 and 255 characters');
    }

    const requestHash = stableHash(req.body);
    const previous = await claimOrWait(key, requestHash);
    if (previous) {
      res.set('Idempotent-Replayed', 'true');
      res.status(previous.statusCode).json(previous.body);
      return;
    }

    persistResponseBeforeSending(res, key);
    next();
  };
}

/** Returns null if we now own the key, or the stored response to replay. */
async function claimOrWait(key: string, requestHash: string): Promise<StoredResponse | null> {
  const deadline = Date.now() + WAIT_FOR_ORIGINAL_MS;

  while (true) {
    const now = new Date();
    try {
      await IdempotencyKey.create({
        _id: key,
        requestHash,
        state: 'in_progress',
        lockedAt: now,
        expiresAt: new Date(now.getTime() + TTL_MS),
      });
      return null; // claimed
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }

    const existing = await IdempotencyKey.findById(key).lean();
    if (!existing) continue; // released or expired between our insert and read: try again

    if (existing.requestHash !== requestHash) {
      throw new HttpError(422, 'Idempotency-Key has already been used with a different request body');
    }
    if (existing.state === 'completed') {
      return { statusCode: existing.statusCode!, body: existing.body };
    }
    if (now.getTime() - existing.lockedAt.getTime() > STALE_LOCK_MS) {
      // The original request died mid-flight. Take over, but only if nobody else already has.
      await IdempotencyKey.deleteOne({ _id: key, lockedAt: existing.lockedAt });
      continue;
    }
    if (Date.now() > deadline) {
      throw conflict('a request with this Idempotency-Key is still being processed');
    }
    await sleep(POLL_MS);
  }
}

/**
 * Wraps res.json so the outcome is saved before the client sees it. That way,
 * any retry that arrives after the client got a response is guaranteed to replay it.
 */
function persistResponseBeforeSending(res: Response, key: string) {
  const send = res.json.bind(res);
  res.json = (body: unknown) => {
    const retryable = res.statusCode === 429 || res.statusCode >= 500;
    const save = retryable
      ? IdempotencyKey.deleteOne({ _id: key })
      : IdempotencyKey.updateOne({ _id: key }, { state: 'completed', statusCode: res.statusCode, body });

    save
      .catch((err) => res.req.log?.error({ err, key }, 'failed to persist idempotent response'))
      .finally(() => send(body));
    return res;
  };
}
