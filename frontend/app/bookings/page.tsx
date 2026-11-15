import { Suspense } from "react";
import { MyBookings } from "@/components/my-bookings";

export const metadata = { title: "My bookings · Clinic Booking" };

export default function MyBookingsPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
        <p className="text-muted-foreground">Look up your appointments by the email you booked with.</p>
      </div>
      {/* useSearchParams needs a Suspense boundary so the page shell can still be prerendered. */}
      <Suspense>
        <MyBookings />
      </Suspense>
    </div>
  );
}
