import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SlotBrowser } from "@/components/slot-browser";

/** The live booking surface, placed straight after the hero (anchor: #book). */
export function BookingSection() {
  return (
    <section id="book" className="scroll-mt-6 mx-auto grid max-w-7xl gap-10 px-4 pt-24 pb-24 sm:px-6">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid max-w-2xl gap-4">
          <h2 className="text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold">Find a time that suits you</h2>
          <p className="text-lg text-muted-foreground">
            Search or filter by day, time of day and doctor. Every time listed is a real open appointment. Pick one, add your name
            and email, and it&apos;s yours.
          </p>
        </div>
        <p className="flex max-w-sm gap-3 rounded-2xl bg-mint p-4 text-sm text-teal-deep">
          <ShieldCheck className="size-5 shrink-0" aria-hidden />
          <span>
            Need to change plans? Find and cancel your visit any time in{" "}
            <Link href="/bookings" className="font-semibold underline underline-offset-4">
              My bookings
            </Link>
            .
          </span>
        </p>
      </div>
      <SlotBrowser />
    </section>
  );
}
