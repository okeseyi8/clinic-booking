import { Slot, type SlotDoc } from './slot.model.js';
import { Booking } from '../bookings/booking.model.js';
import { toIso } from '../../lib/mongo.js';

export interface SlotDto {
  id: string;
  provider: string;
  start: string;
  end: string;
  available: boolean;
}

const toSlotDto = (slot: SlotDoc, available: boolean): SlotDto => ({
  id: slot._id,
  provider: slot.provider,
  start: toIso(slot.start),
  end: toIso(slot.end),
  available,
});

/**
 * Every slot (optionally for one provider), earliest start first, with availability.
 * Two queries regardless of slot count: the slots, then which of them have a
 * confirmed booking (served by the partial unique index). No N+1.
 *
 * ponytail: unpaginated because the spec returns every slot; add a date range
 * or cursor once a clinic has thousands of future slots.
 */
export async function listSlots(provider?: string): Promise<SlotDto[]> {
  const slots = await Slot.find(provider === undefined ? {} : { provider })
    .sort({ start: 1, _id: 1 })
    .lean<SlotDoc[]>();

  const bookedSlotIds = new Set<string>(
    await Booking.distinct('slotId', { status: 'confirmed', slotId: { $in: slots.map((s) => s._id) } }),
  );

  return slots.map((slot) => toSlotDto(slot, !bookedSlotIds.has(slot._id)));
}
