"use client";

import Link from "next/link";
import { CalendarCheck2, CalendarX2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { ErrorState } from "@/components/error-state";
import { useBooking } from "@/hooks/use-bookings";
import { useSlots } from "@/hooks/use-slots";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatDay, formatTimeRange } from "@/lib/format";
import { BOOK_HREF } from "@/lib/site";
import { cn } from "@/lib/utils";

export function BookingDetails({ id }: { id: string }) {
  const { data: booking, isPending, isError, error, refetch } = useBooking(id);
  const { data: slots } = useSlots();

  if (isPending) return <Skeleton className="h-96 rounded-2xl" aria-label="Loading booking" />;
  if (isError) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <ErrorState
        message={missing ? "We couldn't find that booking. Check the link, or look it up in My bookings." : error.message}
        onRetry={missing ? undefined : () => refetch()}
      />
    );
  }

  const slot = slots?.find((s) => s.id === booking.slot_id);
  const confirmed = booking.status === "confirmed";
  const Icon = confirmed ? CalendarCheck2 : CalendarX2;

  return (
    <article className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <header className={cn("grid gap-4 p-8", confirmed ? "bg-mint" : "bg-muted")}>
        <span className={cn("grid size-12 place-items-center rounded-full", confirmed ? "bg-teal text-on-dark" : "bg-card text-muted-foreground")}>
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="grid gap-1">
          <h2 className="text-3xl font-semibold text-teal-deep">{confirmed ? "You're booked in" : "Booking cancelled"}</h2>
          <p className="text-muted-foreground">
            {confirmed
              ? `See you soon, ${booking.name.split(" ")[0]}. Keep this page or your reference for your records.`
              : "This time has been released for someone else."}
          </p>
        </div>
      </header>

      <dl className="grid gap-x-6 gap-y-4 p-8 sm:grid-cols-[9rem_1fr]">
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          <BookingStatusBadge status={booking.status} />
        </dd>
        {slot && (
          <>
            <dt className="text-muted-foreground">Doctor</dt>
            <dd className="font-medium">{slot.provider}</dd>
            <dt className="text-muted-foreground">When</dt>
            <dd className="font-medium">
              {formatDay(slot.start)}, {formatTimeRange(slot.start, slot.end)}
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">Patient</dt>
        <dd>{booking.name}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="break-all">{booking.email}</dd>
        <dt className="text-muted-foreground">Booked on</dt>
        <dd>{formatDateTime(booking.created_at)}</dd>
        <dt className="text-muted-foreground">Reference</dt>
        <dd className="font-mono text-sm break-all">{booking.id}</dd>
      </dl>

      <footer className="flex flex-wrap gap-3 border-t px-8 py-6">
        <CancelBookingButton booking={booking} />
        <Link href={`/bookings?email=${encodeURIComponent(booking.email)}`} className="btn-pill h-11 px-5 text-teal-ink hover:bg-mint">
          All my bookings
        </Link>
        <Link href={BOOK_HREF} className="btn-pill h-11 px-5 text-teal-ink hover:bg-mint">
          Book another time
        </Link>
      </footer>
    </article>
  );
}
