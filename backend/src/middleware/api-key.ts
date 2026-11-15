import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * Level 2: every request must carry the shared secret in `X-API-Key`.
 * Both sides are hashed to a fixed length and compared in constant time, so
 * response timing leaks nothing about how much of a guessed key was correct.
 */
export function requireApiKey(expectedKey: string): RequestHandler {
  const expected = digest(expectedKey);
  return (req, _res, next) => {
    const provided = req.get('X-API-Key');
    if (!provided || !timingSafeEqual(digest(provided), expected)) {
      throw new HttpError(401, 'missing or invalid API key');
    }
    next();
  };
}
