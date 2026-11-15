import { Schema, model } from 'mongoose';

/**
 * Sliding-window log for rate limiting (level 5). One document per limited key
 * (e.g. "booking:ada@example.com") holding the timestamps of recent attempts.
 * Stored in MongoDB so the limit is shared by every API instance and survives
 * restarts. Idle documents are removed by the TTL index.
 */
const rateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    hits: { type: [Date], default: [] },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = model('RateLimit', rateLimitSchema);
