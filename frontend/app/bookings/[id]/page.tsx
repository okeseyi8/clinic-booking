import { Suspense } from "react";
import { BookingDetails } from "@/components/booking-details";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Your booking · Clinic Booking" };

export default function BookingPage({ params }: PageProps<"/bookings/[id]">) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
        <BookingFromParams params={params} />
      </Suspense>
    </div>
  );
}

async function BookingFromParams({ params }: Pick<PageProps<"/bookings/[id]">, "params">) {
  const { id } = await params;
  return <BookingDetails id={id} />;
}
