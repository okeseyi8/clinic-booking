/** One place for cache keys, so invalidation can't drift from the queries it targets. */
export const queryKeys = {
  slots: ["slots"] as const,
  booking: (id: string) => ["booking", id] as const,
  bookingsAll: ["bookings"] as const,
  bookings: (email: string) => ["bookings", email] as const,
};
