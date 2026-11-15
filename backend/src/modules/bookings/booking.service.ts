import { Types, type QueryFilter } from 'mongoose';
import { Booking, type BookingDoc } from './booking.model.js';
import { Slot } from '../slots/slot.model.js';
import { toBookingDto, type BookingDto } from './booking.dto.js';
import { badRequest, conflict, notFound } from '../../lib/http-error.js';
import { decodeCursor, encodeCursor } from '../../lib/cursor.js';
import { isDuplicateKeyError, isObjectIdHex } from '../../lib/mongo.js';

interface NewBooking {
  slotId: string;
  name: string;
  email: string;
}

/**
 * Book a slot. Business-rule order: slot must exist (404), must not have started (400),
 * must not already hold a confirmed booking (409).
 *
 * The 409 is NOT a "check then insert" — that would race. We just insert and let the
 * partial unique index decide; exactly one concurrent request can win.
 */
export async function createBooking({ slotId, name, email }: NewBooking): Promise<BookingDto> {
  const slot = await Slot.findById(slotId).lean();
  if (!slot) throw notFound('slot not found');
  if (slot.start.getTime() <= Date.now()) throw badRequest('slot has already started');

  try {
    const booking = await Booking.create({ slotId, name, email, status: 'confirmed' });
    return toBookingDto(booking.toObject());
  } catch (err) {
    if (isDuplicateKeyError(err)) throw conflict('slot is already booked');
    throw err;
  }
}

export async function getBooking(id: string): Promise<BookingDto> {
  const booking = isObjectIdHex(id) ? await Booking.findById(id).lean<BookingDoc>() : null;
  if (!booking) throw notFound('booking not found');
  return toBookingDto(booking);
}

/**
 * Cancel = one atomic conditional update ("confirmed → cancelled"), so two concurrent
 * cancels can't both succeed. Flipping the status frees the slot immediately because
 * cancelled bookings fall out of the partial unique index.
 */
export async function cancelBooking(id: string): Promise<BookingDto> {
  if (!isObjectIdHex(id)) throw notFound('booking not found');

  const cancelled = await Booking.findOneAndUpdate(
    { _id: id, status: 'confirmed' },
    { $set: { status: 'cancelled' } },
    { returnDocument: 'after' },
  ).lean<BookingDoc>();
  if (cancelled) return toBookingDto(cancelled);

  // Nothing matched: either it doesn't exist, or it was already cancelled.
  if (await Booking.exists({ _id: id })) throw conflict('booking is already cancelled');
  throw notFound('booking not found');
}

export interface BookingPage {
  bookings: BookingDto[];
  next_cursor: string | null;
}

/**
 * One person's bookings, oldest first, with keyset (cursor) pagination over
 * (createdAt, _id) — `_id` breaks ties between bookings created in the same millisecond.
 * We fetch one extra row to know whether another page exists, without a count query.
 */
export async function listBookings({
  email,
  limit,
  cursor,
}: {
  email: string;
  limit: number;
  cursor?: string;
}): Promise<BookingPage> {
  const filter: QueryFilter<BookingDoc> = { email };
  if (cursor) {
    const after = decodeCursor(cursor);
    filter.$or = [
      { createdAt: { $gt: after.createdAt } },
      { createdAt: after.createdAt, _id: { $gt: new Types.ObjectId(after.id) } },
    ];
  }

  const rows = await Booking.find(filter)
    .sort({ createdAt: 1, _id: 1 })
    .limit(limit + 1)
    .lean<BookingDoc[]>();

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    bookings: page.map(toBookingDto),
    next_cursor: rows.length > limit && last ? encodeCursor({ createdAt: last.createdAt, id: last._id.toString() }) : null,
  };
}
