"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Book" },
  { href: "/bookings", label: "My bookings" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Stethoscope className="size-5" aria-hidden />
          Clinic Booking
        </Link>
        {/* The active-link highlight depends on the URL, so it streams in; the links render immediately. */}
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
      </div>
    </header>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex gap-1 text-sm">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground",
            pathname === href && "bg-muted text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
