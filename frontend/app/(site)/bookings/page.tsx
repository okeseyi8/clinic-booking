import { MyBookings } from "@/components/my-bookings";
import { PageHero } from "@/components/site/page-hero";

export const metadata = { title: "My bookings · HowBody" };

export default function MyBookingsPage() {
  return (
    <>
      <PageHero title="My bookings" description="Every visit on your account, in one place. Cancel any time if your plans change." />
      <div className="mx-auto max-w-3xl px-4 pt-20 pb-28 sm:px-6">
        <MyBookings />
      </div>
    </>
  );
}
