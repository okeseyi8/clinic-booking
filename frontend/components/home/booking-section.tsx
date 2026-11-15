import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SlotBrowser } from "@/components/slot-browser";

/** The live booking surface, embedded in the landing page (anchor: #book). */
export function BookingSection() {
  return (
    <section id="book" className="scroll-mt-6 mx-auto grid max-w-7xl gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[0.75fr_1.5fr]">
      <div className="grid content-start gap-5 lg:sticky lg:top-8">
        <h2 className="text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold">Pick a time that suits you</h2>
        <p className="text-lg text-muted-foreground">
          These are real open appointments. Choose one, add your name and email, and it&apos;s yours.
        </p>
        <p className="flex gap-3 rounded-2xl bg-mint p-4 text-sm text-teal-deep">
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
