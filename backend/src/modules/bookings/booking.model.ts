import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const BOOKING_STATUS = ['confirmed', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUS)[number];

const bookingSchema = new Schema(
  {
    slotId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }, // always stored trimmed + lower-case
    status: { type: String, enum: BOOKING_STATUS, required: true, default: 'confirmed' },
  },
  { timestamps: { createdAt: true, updatedAt: true }, versionKey: false },
);

/**
 * THE double-booking guarantee (level 3).
 *
 * At most one *confirmed* booking may exist per slot. MongoDB enforces this
 * atomically on insert, so two requests racing for the same slot — on the
 * same server or on fifty — cannot both succeed: the loser gets E11000 and
 * we return 409. Cancelling flips status to "cancelled", which removes the
 * row from this partial index and frees the slot. No locks, no read-then-write race.
 */
export const ONE_CONFIRMED_BOOKING_PER_SLOT = 'one_confirmed_booking_per_slot';
bookingSchema.index(
  { slotId: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' }, name: ONE_CONFIRMED_BOOKING_PER_SLOT },
);

// GET /bookings?email=… pages through one person's bookings, oldest first (keyset pagination).
bookingSchema.index({ email: 1, createdAt: 1, _id: 1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema> & { _id: Types.ObjectId };
export const Booking = model('Booking', bookingSchema);
