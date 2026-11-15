import type { z } from "zod";
import {
  bookingPageSchema,
  bookingSchema,
  slotListSchema,
  type Booking,
  type BookingPage,
  type Slot,
} from "./schemas";

/** An error response from the API: `{ error }` plus the HTTP status (and Retry-After for 429). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<S extends z.ZodType>(path: string, schema: S, init: RequestInit = {}): Promise<z.infer<S>> {
  // A network failure throws a TypeError here. It is deliberately not an ApiError,
  // so callers can tell "server said no" apart from "request never arrived".
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed (${res.status})`;
    const retryAfter = Number(res.headers.get("Retry-After"));
    throw new ApiError(res.status, message, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined);
  }
  return schema.parse(body);
}

export const api = {
  listSlots: async (): Promise<Slot[]> => (await request("/slots", slotListSchema)).slots,

  getBooking: (id: string): Promise<Booking> => request(`/bookings/${encodeURIComponent(id)}`, bookingSchema),

  /** The signed-in user's bookings. The server scopes the list to the session's email. */
  listMyBookings: ({ cursor, limit = 10 }: { cursor?: string; limit?: number }): Promise<BookingPage> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return request(`/bookings?${params}`, bookingPageSchema);
  },

  /** Name and email come from the signed-in account on the server, so only the slot is sent. */
  createBooking: (input: { slot_id: string }, idempotencyKey: string): Promise<Booking> =>
    request("/bookings", bookingSchema, {
      method: "POST",
      body: JSON.stringify(input),
      headers: { "Idempotency-Key": idempotencyKey },
    }),

  cancelBooking: (id: string): Promise<Booking> =>
    request(`/bookings/${encodeURIComponent(id)}`, bookingSchema, { method: "DELETE" }),
};
