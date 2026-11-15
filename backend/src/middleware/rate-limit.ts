import type { RequestHandler } from 'express';
import { RateLimit } from '../models/rate-limit.model.js';
import { HttpError } from '../lib/http-error.js';

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Sliding-window rate limiter backed by MongoDB.
 *
 * One atomic update per attempt (an update pipeline, so read-modify-write happens
 * inside the database with no race):
 *   1. drop timestamps older than the window
 *   2. if fewer than `limit` remain, record this attempt
 * A sliding window is exact: "5 per minute" means 5 in ANY 60s span, unlike a
 * fixed window that allows a burst of 10 across a minute boundary.
 * Rejected attempts are not recorded, so a spammer cannot extend their own lockout forever.
 */
export async function consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  const doc = await RateLimit.collection.findOneAndUpdate(
    { _id: key as never },
    [
      {
        $set: {
          hits: { $filter: { input: { $ifNull: ['$hits', []] }, as: 'h', cond: { $gt: ['$$h', windowStart] } } },
        },
      },
      { $set: { allowed: { $lt: [{ $size: '$hits' }, limit] } } },
      {
        $set: {
          hits: { $cond: ['$allowed', { $concatArrays: ['$hits', [now]] }, '$hits'] },
          expiresAt: new Date(now.getTime() + windowMs),
        },
      },
    ],
    { upsert: true, returnDocument: 'after' },
  );

  if (doc?.allowed) return { allowed: true, retryAfterSeconds: 0 };

  const oldest = (doc?.hits as Date[] | undefined)?.[0] ?? now;
  const retryAfterMs = oldest.getTime() + windowMs - now.getTime();
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
}

/**
 * Level 5: at most `limit` booking attempts per email per window — failed attempts included.
 * Keyed on the normalised email (trim + lower-case, the same as the stored value),
 * so "Ada@Example.com " and "ada@example.com" share one budget.
 *
 * ponytail: per-email only, as the spec defines. For abuse spread across many
 * emails, add a per-IP limit at the edge (Cloudflare/Render) before scaling this.
 */
export function limitBookingsPerEmail({ limit, windowMs }: { limit: number; windowMs: number }): RequestHandler {
  return async (req, _res, next) => {
    const raw = req.body?.email;
    const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (!email) return next(); // nothing to key on; validation will reject the request

    const { allowed, retryAfterSeconds } = await consume(`booking:${email}`, limit, windowMs);
    if (!allowed) {
      throw new HttpError(429, 'too many booking attempts for this email, try again later', {
        'Retry-After': String(retryAfterSeconds),
      });
    }
    next();
  };
}
