import type { BookingDoc, BookingStatus } from './booking.model.js';
import { toIso } from '../../lib/mongo.js';

/** The public shape from the spec. The DB uses camelCase; the API speaks snake_case. */
export interface BookingDto {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: BookingStatus;
  created_at: string;
}

export const toBookingDto = (b: BookingDoc): BookingDto => ({
  id: b._id.toString(),
  slot_id: b.slotId,
  name: b.name,
  email: b.email,
  status: b.status,
  created_at: toIso(b.createdAt),
});
