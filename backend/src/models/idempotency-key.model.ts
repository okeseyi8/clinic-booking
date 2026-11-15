import { Schema, model } from 'mongoose';

/**
 * One row per Idempotency-Key (level 4).
 *
 * `_id` is the key itself, so "claim this key" is a single atomic insert:
 * exactly one concurrent request wins, the rest see a duplicate and wait for
 * or replay the winner's stored response. Rows expire after 24h via a TTL index.
 */
const idempotencyKeySchema = new Schema(
  {
    _id: { type: String, required: true },
    requestHash: { type: String, required: true },
    state: { type: String, enum: ['in_progress', 'completed'], required: true },
    statusCode: { type: Number },
    body: { type: Schema.Types.Mixed },
    lockedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey = model('IdempotencyKey', idempotencyKeySchema);
