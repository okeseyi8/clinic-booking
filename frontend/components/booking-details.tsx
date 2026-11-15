"use client";

import Link from "next/link";
import { CalendarCheck2, CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { ErrorState } from "@/components/error-state";
import { useBooking } from "@/hooks/use-bookings";
import { useSlots } from "@/hooks/use-slots";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatDay, formatTimeRange } from "@/lib/format";

export function BookingDetails({ id }: { id: string }) {
  const { data: booking, isPending, isError, error, refetch } = useBooking(id);
  const { data: slots } = useSlots();

  if (isPending) return <Skeleton className="h-80 rounded-xl" aria-label="Loading booking" />;
  if (isError) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        message={missing ? "We couldn't find that booking." : error.message}
        onRetry={missing ? undefined : () => refetch()}
      />
    );
  }

  const slot = slots?.find((s) => s.id === booking.slot_id);
  const confirmed = booking.status === "confirmed";
  const Icon = confirmed ? CalendarCheck2 : CalendarX2;

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5" aria-hidden />
        </div>
        <CardTitle className="text-xl">{confirmed ? "You're booked" : "Booking cancelled"}</CardTitle>
        <CardDescription>
          {confirmed ? `See you soon, ${booking.name.split(" ")[0]}.` : "This appointment slot has been released."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <BookingStatusBadge status={booking.status} />
          </dd>
          {slot && (
            <>
              <dt className="text-muted-foreground">Provider</dt>
              <dd>{slot.provider}</dd>
              <dt className="text-muted-foreground">When</dt>
              <dd>
                {formatDay(slot.start)} · {formatTimeRange(slot.start, slot.end)}
              </dd>
            </>
          )}
          <dt className="text-muted-foreground">Patient</dt>
          <dd>{booking.name}</dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="break-all">{booking.email}</dd>
          <dt className="text-muted-foreground">Booked</dt>
          <dd>{formatDateTime(booking.created_at)}</dd>
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="font-mono text-xs break-all">{booking.id}</dd>
        </dl>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <CancelBookingButton booking={booking} />
        <Button variant="ghost" asChild>
          <Link href={`/bookings?email=${encodeURIComponent(booking.email)}`}>All my bookings</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">Book another</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
