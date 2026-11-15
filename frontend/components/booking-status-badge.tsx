import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/lib/schemas";

export function BookingStatusBadge({ status }: { status: Booking["status"] }) {
  return status === "confirmed" ? (
    <Badge className="h-6 bg-mint px-2.5 text-sm text-teal-deep">Confirmed</Badge>
  ) : (
    <Badge className="h-6 bg-muted px-2.5 text-sm text-muted-foreground">Cancelled</Badge>
  );
}
