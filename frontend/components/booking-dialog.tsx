"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { ApiError } from "@/lib/api";
import { formatDay, formatTimeRange } from "@/lib/format";
import { bookingFormSchema, type BookingFormValues, type Slot } from "@/lib/schemas";

type FieldErrors = Partial<Record<keyof BookingFormValues, string>>;

/** Turns an API failure into something a patient can act on. */
function bookingErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "We couldn't reach the clinic. Check your connection and try again.";
  switch (error.status) {
    case 409:
      return "Someone just booked this slot. Please choose another time.";
    case 429:
      return `Too many booking attempts. Please wait ${error.retryAfterSeconds ?? 60} seconds and try again.`;
    case 404:
      return "This slot no longer exists. Please choose another time.";
    default:
      return error.message;
  }
}

export function BookingDialog({ slot, onClose }: { slot: Slot | null; onClose: () => void }) {
  const router = useRouter();
  const createBooking = useCreateBooking();
  const idempotencyKeyFor = useIdempotencyKey();
  const [values, setValues] = useState<BookingFormValues>({ name: "", email: "" });
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slot || createBooking.isPending) return;

    const parsed = bookingFormSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ name: flat.name?.[0], email: flat.email?.[0] });
      return;
    }
    setErrors({});

    const input = { slot_id: slot.id, ...parsed.data };
    createBooking.mutate(
      { input, idempotencyKey: idempotencyKeyFor(input) },
      {
        onSuccess: (booking) => {
          toast.success("Booking confirmed");
          onClose();
          router.push(`/bookings/${booking.id}`);
        },
        onError: (error) => {
          toast.error(bookingErrorMessage(error));
          if (error instanceof ApiError && (error.status === 409 || error.status === 404)) onClose();
        },
      },
    );
  }

  const field = (name: keyof BookingFormValues) => ({
    id: name,
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [name]: e.target.value })),
    "aria-invalid": Boolean(errors[name]) || undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <Dialog open={slot !== null} onOpenChange={(open) => !open && !createBooking.isPending && onClose()}>
      <DialogContent>
        {slot && (
          <form onSubmit={handleSubmit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Book with {slot.provider}</DialogTitle>
              <DialogDescription>
                {formatDay(slot.start)} · {formatTimeRange(slot.start, slot.end)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input autoComplete="name" autoFocus placeholder="Ada Obi" {...field("name")} />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input type="email" autoComplete="email" placeholder="ada@example.com" {...field("email")} />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={createBooking.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBooking.isPending}>
                {createBooking.isPending && <Loader2 className="animate-spin" aria-hidden />}
                Confirm booking
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
