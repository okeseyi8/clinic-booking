"use client";

import { useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDialog } from "@/components/booking-dialog";
import { ErrorState } from "@/components/error-state";
import { useSlots } from "@/hooks/use-slots";
import { dayKey, formatDay, formatTimeRange } from "@/lib/format";
import type { Slot } from "@/lib/schemas";

const ALL = "__all__";

function slotState(slot: Slot, now: number) {
  if (Date.parse(slot.start) <= now) return { bookable: false, label: "Started" };
  if (!slot.available) return { bookable: false, label: "Booked" };
  return { bookable: true, label: "Available" };
}

export function SlotBrowser() {
  const { data: slots, isPending, isError, error, refetch, dataUpdatedAt } = useSlots();
  const [provider, setProvider] = useState(ALL);
  const [selected, setSelected] = useState<Slot | null>(null);

  const providers = useMemo(() => [...new Set(slots?.map((s) => s.provider))].sort(), [slots]);

  // The API already returns slots earliest-first, so grouping preserves order.
  const days = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    for (const slot of slots ?? []) {
      if (provider !== ALL && slot.provider !== provider) continue;
      const key = dayKey(slot.start);
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }
    return [...groups.values()];
  }, [slots, provider]);

  if (isPending) return <SlotsSkeleton />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  // "Started" is judged at fetch time (refreshed every 30s); the server re-checks on booking anyway.
  const now = dataUpdatedAt;

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {slots.filter((s) => slotState(s, now).bookable).length} slots open
        </p>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="w-48" aria-label="Filter by provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All providers</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {days.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
          <CalendarX2 className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">No appointment slots yet. Please check back soon.</p>
        </div>
      ) : (
        days.map((daySlots) => (
          <section key={dayKey(daySlots[0].start)} aria-labelledby={`day-${dayKey(daySlots[0].start)}`}>
            <h2 id={`day-${dayKey(daySlots[0].start)}`} className="mb-3 text-sm font-medium">
              {formatDay(daySlots[0].start)}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {daySlots.map((slot) => {
                const { bookable, label } = slotState(slot, now);
                return (
                  <li key={slot.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums">{formatTimeRange(slot.start, slot.end)}</p>
                      <p className="truncate text-sm text-muted-foreground">{slot.provider}</p>
                    </div>
                    {bookable ? (
                      <Button size="sm" onClick={() => setSelected(slot)}>
                        Book
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">{label}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <BookingDialog slot={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function SlotsSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2" aria-busy="true" aria-label="Loading slots">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-[74px] rounded-xl" />
      ))}
    </div>
  );
}
