import { badRequest } from './http-error.js';

/**
 * Opaque keyset-pagination cursor: the (createdAt, id) of the last row on a page.
 * Keyset pagination stays O(page size) at any depth, unlike skip/offset, and
 * never skips or repeats rows when new bookings are inserted between pages.
 */
export interface Cursor {
  createdAt: Date;
  id: string;
}

export function encodeCursor({ createdAt, id }: Cursor): string {
  return Buffer.from(JSON.stringify({ c: createdAt.toISOString(), i: id })).toString('base64url');
}

export function decodeCursor(raw: string): Cursor {
  try {
    const { c, i } = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    const createdAt = new Date(c);
    if (typeof i !== 'string' || !/^[a-f\d]{24}$/i.test(i) || Number.isNaN(createdAt.getTime())) {
      throw new Error('bad cursor');
    }
    return { createdAt, id: i };
  } catch {
    throw badRequest('cursor is invalid');
  }
}
