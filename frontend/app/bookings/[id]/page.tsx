import { Suspense } from "react";
import { BookingDetails } from "@/components/booking-details";
import { PageHero } from "@/components/site/page-hero";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Your booking · HowBody" };

export default function BookingPage({ params }: PageProps<"/bookings/[id]">) {
  return (
    <>
      <PageHero title="Your appointment" />
      <div className="mx-auto max-w-2xl px-4 pt-20 pb-28 sm:px-6">
        <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
          <BookingFromParams params={params} />
        </Suspense>
      </div>
    </>
  );
}

async function BookingFromParams({ params }: Pick<PageProps<"/bookings/[id]">, "params">) {
  const { id } = await params;
  return <BookingDetails id={id} />;
}
