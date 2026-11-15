"use client";

import { useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDialog } from "@/components/booking-dialog";
import { ErrorState } from "@/components/error-state";
import { useSlots } from "@/hooks/use-slots";
import { dayKey, formatDay, formatTimeRange } from "@/lib/format";
import type { Slot } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const ALL = "All doctors";

function isBookable(slot: Slot, now: number) {
  return slot.available && Date.parse(slot.start) > now;
}

export function SlotBrowser() {
  const { data: slots, isPending, isError, error, refetch, dataUpdatedAt } = useSlots();
  const [provider, setProvider] = useState(ALL);
  const [selected, setSelected] = useState<Slot | null>(null);

  const providers = useMemo(() => [ALL, ...[...new Set(slots?.map((s) => s.provider))].sort()], [slots]);

  // The API returns slots earliest-first, so grouping by day keeps the order.
  const days = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    for (const slot of slots ?? []) {
      if (provider !== ALL && slot.provider !== provider) continue;
      const key = dayKey(slot.start);
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }
    return [...groups.entries()];
  }, [slots, provider]);

  if (isPending) return <SlotsSkeleton />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  // "Started" is judged at fetch time (refreshed every 30s); the server re-checks on booking anyway.
  const now = dataUpdatedAt;
  const openCount = slots.filter((s) => isBookable(s, now)).length;

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
          {openCount === 0 ? "No open times right now" : `${openCount} open ${openCount === 1 ? "time" : "times"}`}
        </p>
        <div role="radiogroup" aria-label="Filter by doctor" className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={provider === p}
              onClick={() => setProvider(p)}
              className={cn(
                "btn-pill h-10 shrink-0 snap-start px-4 text-sm",
                provider === p ? "btn-teal" : "bg-card text-foreground ring-1 ring-border hover:bg-mint",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {days.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-2xl bg-card p-12 text-center ring-1 ring-border">
          <CalendarX2 className="size-7 text-teal" aria-hidden />
          <p className="font-display text-xl font-semibold">No appointment times yet</p>
          <p className="max-w-sm text-muted-foreground">New times are added every week. Check back soon, or call us to be seen sooner.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {days.map(([key, daySlots]) => (
            <section key={key} aria-labelledby={`day-${key}`} className="grid gap-3">
              <h3 id={`day-${key}`} className="font-sans text-base font-semibold tracking-normal">
                {formatDay(daySlots[0]!.start)}
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {daySlots.map((slot) => {
                  const bookable = isBookable(slot, now);
                  const status = Date.parse(slot.start) <= now ? "Started" : "Booked";
                  return (
                    <li key={slot.id}>
                      <button
                        type="button"
                        disabled={!bookable}
                        onClick={() => setSelected(slot)}
                        aria-label={`${formatTimeRange(slot.start, slot.end)} with ${slot.provider}${bookable ? "" : `, ${status.toLowerCase()}`}`}
                        className={cn(
                          "group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left outline-none transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/60",
                          bookable
                            ? "bg-card ring-1 ring-border hover:bg-mint hover:ring-teal/40 active:translate-y-px"
                            : "cursor-not-allowed bg-muted text-muted-foreground",
                        )}
                      >
                        <span className="grid">
                          <span className="font-semibold tabular-nums">{formatTimeRange(slot.start, slot.end)}</span>
                          <span className="text-sm text-muted-foreground">{slot.provider}</span>
                        </span>
                        {bookable ? (
                          <span className="rounded-full bg-teal px-3 py-1 text-sm font-semibold text-on-dark transition-colors group-hover:bg-teal-deep">
                            Book
                          </span>
                        ) : (
                          <span className="text-sm">{status}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <BookingDialog slot={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function SlotsSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading open times">
      <Skeleton className="h-10 w-72 rounded-full" />
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
