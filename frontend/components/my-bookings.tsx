"use client";

import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { ErrorState } from "@/components/error-state";
import { useMyBookings } from "@/hooks/use-bookings";
import { useSlots } from "@/hooks/use-slots";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { useSession } from "@/lib/auth-client";
import { formatDay, formatTimeRange, formatDateTime } from "@/lib/format";

const listSkeleton = (
  <div className="grid gap-2" aria-busy="true" aria-label="Loading bookings">
    {Array.from({ length: 3 }, (_, i) => (
      <Skeleton key={i} className="h-24 rounded-2xl" />
    ))}
  </div>
);

export function MyBookings() {
  const { data: session, isPending } = useSession();
  const openAuth = useAuthDialog();

  if (isPending) return listSkeleton;
  if (!session) {
    return (
      <div className="grid justify-items-center gap-4 rounded-2xl bg-card p-10 text-center ring-1 ring-border">
        <span className="grid size-12 place-items-center rounded-full bg-mint text-teal">
          <LogIn className="size-6" aria-hidden />
        </span>
        <p className="font-display text-xl font-semibold">Log in to see your bookings</p>
        <p className="max-w-sm text-muted-foreground">Your visits are tied to your HowBody account, so only you can see or cancel them.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => openAuth()}>Log in</Button>
          <Button variant="outline" onClick={() => openAuth({ view: "signup" })}>
            Create account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <p className="text-muted-foreground">
        Signed in as <span className="font-semibold text-foreground">{session.user.email}</span>
      </p>
      <BookingList userId={session.user.id} />
    </div>
  );
}

function BookingList({ userId }: { userId: string }) {
  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyBookings(userId);
  const { data: slots } = useSlots();
  const slotById = new Map(slots?.map((s) => [s.id, s]));

  if (isPending) return listSkeleton;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const bookings = data.pages.flatMap((page) => page.bookings);
  if (bookings.length === 0) {
    return (
      <div className="grid justify-items-center gap-4 rounded-2xl bg-card p-10 text-center ring-1 ring-border">
        <p className="font-display text-xl font-semibold">No bookings yet</p>
        <p className="text-muted-foreground">When you book a visit, it shows up here.</p>
        <Button asChild>
          <Link href="/#book">Find a time</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <ul className="grid gap-2">
        {bookings.map((booking) => {
          const slot = slotById.get(booking.slot_id);
          return (
            <li key={booking.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
              <Link href={`/bookings/${booking.id}`} className="min-w-0 grow hover:underline underline-offset-4">
                <p className="font-medium">
                  {slot ? `${formatDay(slot.start)} · ${formatTimeRange(slot.start, slot.end)}` : `Slot ${booking.slot_id}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {slot?.provider ?? "Provider unavailable"} · booked {formatDateTime(booking.created_at)}
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <BookingStatusBadge status={booking.status} />
                <CancelBookingButton booking={booking} size="sm" />
              </div>
            </li>
          );
        })}
      </ul>
      {hasNextPage && (
        <Button variant="outline" className="justify-self-center" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage && <Loader2 className="animate-spin" aria-hidden />}
          Load more
        </Button>
      )}
    </div>
  );
}
