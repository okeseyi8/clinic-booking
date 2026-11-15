import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/lib/schemas";

export function BookingStatusBadge({ status }: { status: Booking["status"] }) {
  return status === "confirmed" ? (
    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Confirmed</Badge>
  ) : (
    <Badge variant="secondary">Cancelled</Badge>
  );
}
