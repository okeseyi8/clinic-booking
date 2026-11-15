import { Suspense } from "react";
import { MyBookings } from "@/components/my-bookings";
import { PageHero } from "@/components/site/page-hero";

export const metadata = { title: "My bookings · HowBody" };

export default function MyBookingsPage() {
  return (
    <>
      <PageHero title="My bookings" description="Look up your appointments with the email you booked with." />
      <div className="mx-auto max-w-3xl px-4 pt-20 pb-28 sm:px-6">
        {/* useSearchParams needs a Suspense boundary so the page shell can still be prerendered. */}
        <Suspense>
          <MyBookings />
        </Suspense>
      </div>
    </>
  );
}
