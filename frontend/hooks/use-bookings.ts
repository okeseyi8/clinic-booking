"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Booking } from "@/lib/schemas";

export function useBooking(id: string) {
  return useQuery({ queryKey: queryKeys.booking(id), queryFn: () => api.getBooking(id) });
}

/** The signed-in user's bookings. Cursor pagination: each page hands back `next_cursor` until it's null. */
export function useMyBookings(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.bookings(userId ?? ""),
    queryFn: ({ pageParam }) => api.listMyBookings({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: Boolean(userId),
  });
}

interface CreateBookingVars {
  input: { slot_id: string };
  idempotencyKey: string;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: CreateBookingVars) => api.createBooking(input, idempotencyKey),
    // Retrying a POST is only safe because every attempt carries the same Idempotency-Key.
    // Retry only when the request never got an answer. An ApiError is a real decision from the server.
    retry: (failureCount, error) => !(error instanceof ApiError) && failureCount < 2,
    onSuccess: (booking) => queryClient.setQueryData(queryKeys.booking(booking.id), booking),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.slots }),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: (booking: Booking) => {
      queryClient.setQueryData(queryKeys.booking(booking.id), booking);
      queryClient.invalidateQueries({ queryKey: queryKeys.slots });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookingsAll });
    },
  });
}
