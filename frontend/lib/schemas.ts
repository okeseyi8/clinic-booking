import { z } from "zod";

/**
 * Runtime contracts for everything crossing the network boundary.
 * API responses are parsed rather than trusted, so a backend change fails
 * loudly at the edge instead of as `undefined` deep inside a component.
 */

export const slotSchema = z.object({
  id: z.string(),
  provider: z.string(),
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }),
  available: z.boolean(),
});
export type Slot = z.infer<typeof slotSchema>;

export const slotListSchema = z.object({ slots: z.array(slotSchema) });

export const bookingSchema = z.object({
  id: z.string(),
  slot_id: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.enum(["confirmed", "cancelled"]),
  created_at: z.iso.datetime({ offset: true }),
});
export type Booking = z.infer<typeof bookingSchema>;

export const bookingPageSchema = z.object({
  bookings: z.array(bookingSchema),
  next_cursor: z.string().nullable(),
});
export type BookingPage = z.infer<typeof bookingPageSchema>;

/** Form input. Mirrors the API's rules so most mistakes are caught before a request. */
export const bookingFormSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name").max(200, "Name is too long"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
});
export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));
