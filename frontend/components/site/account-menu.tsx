"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, LogOut } from "lucide-react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { signOut, useSession } from "@/lib/auth-client";

/** Log in link when signed out; an initial-avatar disclosure with account actions when signed in. */
export function AccountMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending } = useSession();
  const openAuth = useAuthDialog();

  if (isPending) return <span className="size-11 animate-pulse rounded-full bg-on-dark/15" aria-hidden />;

  if (!session) {
    return (
      <button
        type="button"
        onClick={() => openAuth()}
        className="rounded-full px-4 py-2.5 text-[0.95rem] font-semibold text-on-dark ring-1 ring-on-dark/40 transition-colors hover:bg-on-dark/10 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
      >
        Log in
      </button>
    );
  }

  const { name, email } = session.user;
  return (
    <details className="relative">
      <summary
        aria-label={`Account menu for ${name}`}
        className="grid size-11 cursor-pointer list-none place-items-center rounded-full bg-mint-strong font-display text-lg font-semibold text-teal-deep outline-none focus-visible:ring-3 focus-visible:ring-ring/60 [&::-webkit-details-marker]:hidden"
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </summary>
      <div className="absolute right-0 top-14 z-(--z-modal) grid w-64 gap-1 rounded-2xl bg-card p-2 text-foreground shadow-[0_8px_8px_-4px_oklch(0.21_0.022_205/0.25)]">
        <div className="px-4 pt-2 pb-3">
          <p className="truncate font-semibold">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <Link href="/bookings" className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium hover:bg-mint">
          <CalendarCheck2 className="size-4.5 text-teal" aria-hidden />
          My bookings
        </Link>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            // Drop cached bookings so the next person on this device can't see them.
            queryClient.removeQueries({ queryKey: ["bookings"] });
            queryClient.removeQueries({ queryKey: ["booking"] });
            router.push("/");
          }}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-left font-medium hover:bg-mint"
        >
          <LogOut className="size-4.5 text-teal" aria-hidden />
          Log out
        </button>
      </div>
    </details>
  );
}
