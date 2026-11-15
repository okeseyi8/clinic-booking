import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * A bookable appointment slot. The id is supplied by the client (e.g. "s1"),
 * so we use it directly as `_id` — one unique index, no translation layer.
 */
const slotSchema = new Schema(
  {
    _id: { type: String, required: true },
    provider: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  { versionKey: false },
);

// GET /slots sorts by start, optionally filtered by provider.
slotSchema.index({ start: 1 });
slotSchema.index({ provider: 1, start: 1 });

export type SlotDoc = InferSchemaType<typeof slotSchema>;
export const Slot = model('Slot', slotSchema);
