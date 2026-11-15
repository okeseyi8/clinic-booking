import Joi from 'joi';
import { Slot } from '../slots/slot.model.js';
import { slotInputSchema, type SlotInput } from '../slots/slot.schema.js';
import { Booking } from '../bookings/booking.model.js';
import { IdempotencyKey } from '../../models/idempotency-key.model.js';
import { RateLimit } from '../../models/rate-limit.model.js';

export const resetSchema = Joi.object<{ slots: SlotInput[] }>({
  slots: Joi.array().items(slotInputSchema).unique('id').max(10_000).required(),
});

/**
 * Wipe all bookings (and the state derived from them: idempotency records,
 * rate-limit counters) and replace every slot. Past slots are allowed.
 *
 * ponytail: not wrapped in a transaction — this is an admin/test operation.
 * Use session.withTransaction() if reset ever runs alongside live traffic.
 */
export async function resetSlots(slots: SlotInput[]): Promise<void> {
  await Promise.all([Booking.deleteMany({}), IdempotencyKey.deleteMany({}), RateLimit.deleteMany({})]);
  await Slot.deleteMany({});
  if (slots.length > 0) {
    await Slot.insertMany(
      slots.map(({ id, provider, start, end }) => ({ _id: id, provider, start, end })),
      { ordered: true },
    );
  }
}
