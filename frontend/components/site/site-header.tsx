import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "./logo";
import { BOOK_HREF, BOOK_LABEL } from "@/lib/site";

const links = [
  { href: "/#services", label: "Services" },
  { href: "/#doctors", label: "Doctors" },
  { href: "/bookings", label: "My bookings" },
  { href: "/#contact", label: "Contact" },
];

/**
 * Top navigation, always sitting on the teal brand surface.
 * The mobile menu is a native <details> disclosure: keyboard and screen-reader
 * friendly, and it works without JavaScript.
 */
export function SiteHeader() {
  return (
    <header className="relative z-(--z-sticky) mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
      <Logo />

      <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-full px-4 py-2 text-[0.95rem] font-medium text-on-dark-muted transition-colors hover:text-on-dark focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Link href={BOOK_HREF} className="btn-pill btn-light hidden h-11 px-5 sm:inline-flex">
          {BOOK_LABEL}
        </Link>

        <details className="group relative md:hidden">
          <summary
            aria-label="Open menu"
            className="grid size-11 cursor-pointer list-none place-items-center rounded-full text-on-dark ring-1 ring-on-dark/30 [&::-webkit-details-marker]:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </summary>
          <nav
            aria-label="Mobile"
            className="absolute right-0 top-14 grid w-60 gap-1 rounded-2xl bg-card p-2 text-foreground shadow-[0_8px_8px_-4px_oklch(0.21_0.022_205/0.25)]"
          >
            {[...links, { href: BOOK_HREF, label: BOOK_LABEL }].map(({ href, label }) => (
              <Link key={href} href={href} className="rounded-xl px-4 py-3 font-medium hover:bg-mint">
                {label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
