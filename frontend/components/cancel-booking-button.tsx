"use client";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCancelBooking } from "@/hooks/use-bookings";
import type { Booking } from "@/lib/schemas";

export function CancelBookingButton({ booking, size = "default" }: { booking: Booking; size?: "default" | "sm" }) {
  const cancel = useCancelBooking();
  if (booking.status !== "confirmed") return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size={size} disabled={cancel.isPending}>
          Cancel booking
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
          <AlertDialogDescription>The slot will be released and someone else may book it.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep booking</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              cancel.mutate(booking.id, {
                onSuccess: () => toast.success("Booking cancelled"),
                onError: (error) => toast.error(error.message),
              })
            }
          >
            Cancel booking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
