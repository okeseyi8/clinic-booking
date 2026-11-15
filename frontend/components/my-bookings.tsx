"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { ErrorState } from "@/components/error-state";
import { useBookingsByEmail } from "@/hooks/use-bookings";
import { useSlots } from "@/hooks/use-slots";
import { formatDay, formatTimeRange, formatDateTime } from "@/lib/format";
import { emailSchema } from "@/lib/schemas";

export function MyBookings() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The email lives in the URL, so a lookup is shareable and survives a refresh.
  const email = searchParams.get("email");
  const [draft, setDraft] = useState(email ?? "");
  const [inputError, setInputError] = useState<string>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(draft);
    if (!parsed.success) return setInputError(parsed.error.issues[0]?.message);
    setInputError(undefined);
    router.replace(`${pathname}?email=${encodeURIComponent(parsed.data)}`);
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} noValidate className="grid gap-2">
        <Label htmlFor="lookup-email">Email used when booking</Label>
        <div className="flex gap-2">
          <Input
            id="lookup-email"
            type="email"
            autoComplete="email"
            placeholder="ada@example.com"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-invalid={Boolean(inputError) || undefined}
            aria-describedby={inputError ? "lookup-email-error" : undefined}
          />
          <Button type="submit">
            <Search aria-hidden />
            Find
          </Button>
        </div>
        {inputError && (
          <p id="lookup-email-error" className="text-sm text-destructive">
            {inputError}
          </p>
        )}
      </form>

      {email && <BookingList email={email} />}
    </div>
  );
}

function BookingList({ email }: { email: string }) {
  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBookingsByEmail(email);
  const { data: slots } = useSlots();
  const slotById = new Map(slots?.map((s) => [s.id, s]));

  if (isPending) {
    return (
      <div className="grid gap-2" aria-busy="true" aria-label="Loading bookings">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const bookings = data.pages.flatMap((page) => page.bookings);
  if (bookings.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-10 text-center text-muted-foreground ring-1 ring-border">
        No bookings found for {email}.
      </p>
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
