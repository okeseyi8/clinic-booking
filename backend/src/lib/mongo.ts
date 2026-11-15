/** MongoDB duplicate-key error (a unique index rejected the write). */
export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

/** Booking ids are ObjectIds; anything else can't exist, so callers can 404 without a query. */
export const isObjectIdHex = (id: string) => /^[a-f\d]{24}$/i.test(id);

/** ISO-8601 in UTC, dropping zero milliseconds: 2026-12-10T09:00:00Z (matches the spec's examples). */
export const toIso = (date: Date) => date.toISOString().replace('.000Z', 'Z');
