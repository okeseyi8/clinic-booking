import { Router } from 'express';
import { idempotency } from '../../middleware/idempotency.js';
import { limitBookingsPerEmail } from '../../middleware/rate-limit.js';
import * as bookings from './booking.controller.js';

export const BOOKING_RATE_LIMIT = { limit: 5, windowMs: 60_000 };

export const bookingRoutes = Router();

/**
 * Middleware order matters:
 *  1. idempotency — a replayed retry (or a 422 mismatch) returns before it can
 *     spend the caller's rate-limit budget or touch the booking logic.
 *  2. rate limit  — counts every *new* attempt, including ones that fail validation.
 *  3. controller  — validation + booking.
 */
bookingRoutes.post('/', idempotency(), limitBookingsPerEmail(BOOKING_RATE_LIMIT), bookings.create);
bookingRoutes.get('/', bookings.list);
bookingRoutes.get('/:id', bookings.get);
bookingRoutes.delete('/:id', bookings.cancel);
