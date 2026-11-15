"use client";

import { useMemo, useState } from "react";
import { CalendarX2, Search, SearchX, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDialog } from "@/components/booking-dialog";
import { ErrorState } from "@/components/error-state";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { useSlots } from "@/hooks/use-slots";
import { useSession } from "@/lib/auth-client";
import { dayKey, formatDay, formatTimeRange } from "@/lib/format";
import type { Slot } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const ANY = "any";

/** Parts of the day, by the hour the visit starts in the viewer's timezone. */
const PERIODS = [
  { value: ANY, label: "Any time" },
  { value: "morning", label: "Morning", test: (h: number) => h < 12 },
  { value: "afternoon", label: "Afternoon", test: (h: number) => h >= 12 && h < 17 },
  { value: "evening", label: "Evening", test: (h: number) => h >= 17 },
] as const;
type Period = (typeof PERIODS)[number]["value"];

const shortDay = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });

function isBookable(slot: Slot, now: number) {
  return slot.available && Date.parse(slot.start) > now;
}

/**
 * Lets patients narrow the clinic's open times to the ones that suit them.
 * All filtering is client-side: the slot list is small and already cached by TanStack Query,
 * so every keystroke is instant and costs no requests.
 */
export function SlotBrowser() {
  const { data: slots, isPending, isError, error, refetch, dataUpdatedAt } = useSlots();
  const [query, setQuery] = useState("");
  const [day, setDay] = useState(ANY);
  const [period, setPeriod] = useState<Period>(ANY);
  const [provider, setProvider] = useState(ANY);
  const [openOnly, setOpenOnly] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const { data: session } = useSession();
  const openAuth = useAuthDialog();

  // Signed-out patients log in first; the booking confirmation opens as soon as they're in.
  const pick = (slot: Slot) => {
    if (session) return setSelected(slot);
    openAuth({
      description: `Log in or create an account to book ${formatDay(slot.start)}, ${formatTimeRange(slot.start, slot.end)} with ${slot.provider}.`,
      onSuccess: () => setSelected(slot),
    });
  };

  // "Started" is judged at fetch time (refreshed every 30s); the server re-checks on booking anyway.
  const now = dataUpdatedAt;

  const providers = useMemo(() => [...new Set(slots?.map((s) => s.provider))].sort(), [slots]);
  const dayOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of slots ?? []) if (!seen.has(dayKey(s.start))) seen.set(dayKey(s.start), shortDay.format(new Date(s.start)));
    return [...seen.entries()];
  }, [slots]);

  // The API returns slots earliest-first, so grouping by day keeps the order.
  const days = useMemo(() => {
    const q = query.trim().toLowerCase();
    const periodTest = PERIODS.find((p) => p.value === period);
    const groups = new Map<string, Slot[]>();
    for (const slot of slots ?? []) {
      if (openOnly && !isBookable(slot, now)) continue;
      if (provider !== ANY && slot.provider !== provider) continue;
      const key = dayKey(slot.start);
      if (day !== ANY && key !== day) continue;
      if (periodTest && "test" in periodTest && !periodTest.test(new Date(slot.start).getHours())) continue;
      if (q) {
        const haystack = `${slot.provider} ${formatDay(slot.start)} ${formatTimeRange(slot.start, slot.end)}`.toLowerCase();
        if (!haystack.includes(q)) continue;
      }
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }
    return [...groups.entries()];
  }, [slots, query, day, period, provider, openOnly, now]);

  if (isPending) return <SlotsSkeleton />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const shown = days.reduce((n, [, s]) => n + s.length, 0);
  const filtered = query !== "" || day !== ANY || period !== ANY || provider !== ANY;
  const clearFilters = () => {
    setQuery("");
    setDay(ANY);
    setPeriod(ANY);
    setProvider(ANY);
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-5 rounded-2xl bg-card p-4 ring-1 ring-border sm:p-6">
        <label className="relative block">
          <span className="sr-only">Search open times</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a doctor, day or time, e.g. Bello, Friday, 10:30"
            className="h-12 w-full rounded-xl border border-input bg-surface pr-4 pl-12 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>

        <FilterRow label="Day" value={day} onChange={setDay} options={[[ANY, "Any day"], ...dayOptions]} />
        <FilterRow label="Time" value={period} onChange={(v) => setPeriod(v as Period)} options={PERIODS.map((p) => [p.value, p.label])} />
        <FilterRow label="Doctor" value={provider} onChange={setProvider} options={[[ANY, "All doctors"], ...providers.map((p) => [p, p] as [string, string])]} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="size-4 accent-(--teal)" />
            Only show open times
          </label>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {shown} {shown === 1 ? "time" : "times"} {openOnly ? "open" : "shown"}
            </p>
            {filtered && (
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-ink underline-offset-4 hover:underline">
                <X className="size-4" aria-hidden />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {days.length === 0 ? (
        <EmptyState filtered={filtered} onClear={clearFilters} />
      ) : (
        <div className="grid gap-8">
          {days.map(([key, daySlots]) => (
            <section key={key} aria-labelledby={`day-${key}`} className="grid gap-3">
              <h3 id={`day-${key}`} className="font-sans text-base font-semibold tracking-normal">
                {formatDay(daySlots[0]!.start)}
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {daySlots.map((slot) => (
                  <SlotButton key={slot.id} slot={slot} bookable={isBookable(slot, now)} started={Date.parse(slot.start) <= now} onPick={pick} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <BookingDialog slot={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function FilterRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[4.5rem_1fr] sm:items-center">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={`Filter by ${label.toLowerCase()}`} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 py-1">
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn(
              "btn-pill h-9 shrink-0 snap-start px-4 text-sm",
              value === v ? "btn-teal" : "bg-surface text-foreground ring-1 ring-border hover:bg-mint",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function SlotButton({ slot, bookable, started, onPick }: { slot: Slot; bookable: boolean; started: boolean; onPick: (s: Slot) => void }) {
  const status = started ? "Started" : "Booked";
  return (
    <li>
      <button
        type="button"
        disabled={!bookable}
        onClick={() => onPick(slot)}
        aria-label={`${formatTimeRange(slot.start, slot.end)} with ${slot.provider}${bookable ? "" : `, ${status.toLowerCase()}`}`}
        className={cn(
          "group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left outline-none transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/60",
          bookable ? "bg-card ring-1 ring-border hover:bg-mint hover:ring-teal/40 active:translate-y-px" : "cursor-not-allowed bg-muted text-muted-foreground",
        )}
      >
        <span className="grid">
          <span className="font-semibold tabular-nums">{formatTimeRange(slot.start, slot.end)}</span>
          <span className="text-sm text-muted-foreground">{slot.provider}</span>
        </span>
        {bookable ? (
          <span className="rounded-full bg-teal px-3 py-1 text-sm font-semibold text-on-dark transition-colors group-hover:bg-teal-deep">Book</span>
        ) : (
          <span className="text-sm">{status}</span>
        )}
      </button>
    </li>
  );
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  const Icon = filtered ? SearchX : CalendarX2;
  return (
    <div className="grid justify-items-center gap-3 rounded-2xl bg-card p-12 text-center ring-1 ring-border">
      <Icon className="size-7 text-teal" aria-hidden />
      <p className="font-display text-xl font-semibold">{filtered ? "No times match your search" : "No open times right now"}</p>
      <p className="max-w-sm text-muted-foreground">
        {filtered ? "Try another day, a wider time of day, or a different doctor." : "New times are added every week. Check back soon, or call us to be seen sooner."}
      </p>
      {filtered && (
        <button type="button" onClick={onClear} className="btn-pill btn-teal mt-2 h-10 text-sm">
          Clear filters
        </button>
      )}
    </div>
  );
}

function SlotsSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading open times">
      <Skeleton className="h-64 rounded-2xl" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
