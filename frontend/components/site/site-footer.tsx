import Link from "next/link";
import { Logo } from "./logo";
import { BOOK_HREF, BOOK_LABEL, CONTACT } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="scallop-t bg-night text-on-dark [--edge:var(--night)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-20 pb-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid content-start gap-4">
          <Logo />
          <p className="max-w-sm text-on-dark-muted">
            A family practice for every body in the house. Real doctors, real
            time to talk, and open slots you can book tonight.
          </p>
        </div>

        <nav aria-label="Footer" className="grid content-start gap-3">
          <p className="font-display text-lg font-semibold">Visit</p>
          <Link
            href={BOOK_HREF}
            className="text-on-dark-muted hover:text-on-dark"
          >
            {BOOK_LABEL}
          </Link>
          <Link
            href="/bookings"
            className="text-on-dark-muted hover:text-on-dark"
          >
            My bookings
          </Link>
          <Link
            href="/#services"
            className="text-on-dark-muted hover:text-on-dark"
          >
            Services
          </Link>
          <Link
            href="/#doctors"
            className="text-on-dark-muted hover:text-on-dark"
          >
            Our doctors
          </Link>
        </nav>

        <address className="grid content-start gap-3 not-italic">
          <p className="font-display text-lg font-semibold">Clinic</p>
          <span className="text-on-dark-muted">{CONTACT.address}</span>
          <span className="text-on-dark-muted">{CONTACT.hours}</span>
          <a
            href={CONTACT.phoneHref}
            className="text-on-dark-muted hover:text-on-dark"
          >
            {CONTACT.phone}
          </a>
        </address>
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 border-t border-on-dark/15 px-4 py-5 text-sm text-on-dark-muted sm:px-6">
        <span>© 2026 HowBody Clinic</span>
        <span>In an emergency, call 112.</span>
      </div>

      {/* Oversized wordmark from the brand reference, cropped by the page edge. Decorative. */}
      <div className="overflow-hidden">
        <p
          aria-hidden
          className="-mb-[0.22em] select-none text-center font-display text-[clamp(5rem,24vw,22rem)] leading-none font-semibold tracking-[-0.03em] text-teal"
        >
          HowBody
        </p>
      </div>
    </footer>
  );
}
