"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { ApiError } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { formatDay, formatTimeRange } from "@/lib/format";
import type { Slot } from "@/lib/schemas";

/** Turns an API failure into something a patient can act on. */
function bookingErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "We couldn't reach the clinic. Check your connection and try again.";
  switch (error.status) {
    case 401:
      return "Your session has ended. Please log in again to book.";
    case 409:
      return "Someone just booked this slot. Please choose another time.";
    case 429:
      return `Too many booking attempts. Please wait ${error.retryAfterSeconds ?? 60} seconds and try again.`;
    case 404:
      return "This slot no longer exists. Please choose another time.";
    default:
      return error.message;
  }
}

/** Where to come back to after logging in: the booking section. */
const RETURN_TO = encodeURIComponent("/#book");

export function BookingDialog({ slot, onClose }: { slot: Slot | null; onClose: () => void }) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const createBooking = useCreateBooking();
  const idempotencyKeyFor = useIdempotencyKey();

  function confirm() {
    if (!slot || !session || createBooking.isPending) return;
    const input = { slot_id: slot.id };
    createBooking.mutate(
      // The user id is part of the fingerprint, so a different account never reuses a key.
      { input, idempotencyKey: idempotencyKeyFor({ ...input, user: session.user.id }) },
      {
        onSuccess: (booking) => {
          toast.success("Booking confirmed");
          onClose();
          router.push(`/bookings/${booking.id}`);
        },
        onError: (error) => {
          toast.error(bookingErrorMessage(error));
          if (error instanceof ApiError && [401, 404, 409].includes(error.status)) onClose();
        },
      },
    );
  }

  return (
    <Dialog open={slot !== null} onOpenChange={(open) => !open && !createBooking.isPending && onClose()}>
      <DialogContent>
        {slot && (
          <div className="grid gap-5">
            <DialogHeader>
              <DialogTitle>{session || sessionPending ? `Book with ${slot.provider}` : "Log in to book this time"}</DialogTitle>
              <DialogDescription>
                {session || sessionPending
                  ? "Check the details below, then confirm."
                  : "You need a HowBody account to book. It takes less than a minute, and you can manage every visit in one place."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 rounded-xl bg-mint p-4 text-teal-deep">
              <CalendarClock className="size-5 shrink-0" aria-hidden />
              <p>
                <span className="font-semibold">{formatDay(slot.start)}</span>
                <span className="block text-sm tabular-nums">
                  {formatTimeRange(slot.start, slot.end)} with {slot.provider}
                </span>
              </p>
            </div>

            {sessionPending ? (
              <Skeleton className="h-16 rounded-xl" />
            ) : session ? (
              <div className="flex items-center gap-3 rounded-xl p-4 ring-1 ring-border">
                <UserRound className="size-5 shrink-0 text-teal" aria-hidden />
                <p className="min-w-0">
                  <span className="block font-semibold">{session.user.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{session.user.email}</span>
                </p>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={createBooking.isPending}>
                Not now
              </Button>
              {session ? (
                <Button type="button" onClick={confirm} disabled={createBooking.isPending} autoFocus>
                  {createBooking.isPending && <Loader2 className="animate-spin" aria-hidden />}
                  Confirm booking
                </Button>
              ) : (
                !sessionPending && (
                  <>
                    <Button asChild variant="secondary">
                      <Link href={`/signup?next=${RETURN_TO}`}>Create account</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/login?next=${RETURN_TO}`}>Log in</Link>
                    </Button>
                  </>
                )
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
