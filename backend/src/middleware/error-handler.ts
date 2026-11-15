import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';

/** Any route we don't serve. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'route not found' });
};

/**
 * The single place errors become HTTP responses. Every error leaves as
 * `{ "error": "<message>" }` (the spec's contract), and internal details of
 * unexpected errors are logged, never leaked to the client.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    res.set(err.headers).status(err.status).json({ error: err.message });
    return;
  }

  // Errors raised by express.json() (body-parser).
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'request body must be valid JSON' });
    return;
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: 'request body is too large' });
    return;
  }
  if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500 && err.expose) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  req.log?.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'internal server error' });
};
