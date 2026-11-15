import mongoose from 'mongoose';
import { Slot } from '../modules/slots/slot.model.js';
import { Booking } from '../modules/bookings/booking.model.js';
import { IdempotencyKey } from '../models/idempotency-key.model.js';
import { RateLimit } from '../models/rate-limit.model.js';

const models = [Slot, Booking, IdempotencyKey, RateLimit];

/**
 * Connect, then make sure every index exists BEFORE accepting traffic.
 * Correctness (no double booking, idempotency claims, TTL cleanup) depends on
 * unique/partial/TTL indexes, so we never rely on Mongoose's lazy background autoIndex.
 */
export async function connectDb(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: false,
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10_000,
  });
  await Promise.all(models.map((m) => m.syncIndexes()));
}

export const disconnectDb = () => mongoose.disconnect();

export const isDbReady = () => mongoose.connection.readyState === 1;
