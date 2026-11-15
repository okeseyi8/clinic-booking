import Image from "next/image";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { BOOK_HREF, BOOK_LABEL, heroPhotos } from "@/lib/site";

/*
 * Edge-to-edge strip of three straight photos with a thin teal gap between them.
 * Teal scallops from the text block above hang over the top of the strip.
 */
const panels = [
  { photo: heroPhotos.left, delay: "200ms" },
  { photo: heroPhotos.center, delay: "280ms", priority: true },
  { photo: heroPhotos.right, delay: "360ms" },
];

export function Hero() {
  return (
    <section className="scallop-b overflow-x-clip bg-teal pb-8 text-on-dark [--edge:var(--teal)] md:pb-10">
      <div className="scallop-b [--edge:var(--teal)]">
        <SiteHeader />
        <div className="mx-auto grid max-w-7xl justify-items-center gap-6 px-4 pt-10 pb-12 text-center sm:px-6 md:pt-14 md:pb-14">
          <h1 className="rise max-w-3xl text-[clamp(2.75rem,7vw,5.25rem)] font-semibold">Care that knows you by name.</h1>
          <p className="rise max-w-xl text-lg text-on-dark-muted [--d:120ms] md:text-xl">
            A family practice for every age. See today&apos;s open times and book your visit in under a minute.
          </p>
          {/* Pill plus companion icon disc, as in the reference. One link, one focus target. */}
          <Link
            href={BOOK_HREF}
            className="rise group inline-flex items-center gap-1.5 rounded-full outline-none [--d:220ms] focus-visible:ring-3 focus-visible:ring-ring/60"
          >
            <span className="btn-pill btn-light group-active:translate-y-px">{BOOK_LABEL}</span>
            <span
              aria-hidden
              className="grid size-12 place-items-center rounded-full bg-on-dark text-teal-deep transition-[background-color,transform] duration-300 ease-(--ease-out-expo) group-hover:rotate-12 group-hover:bg-mint"
            >
              <CalendarCheck className="size-5" />
            </span>
          </Link>
        </div>
      </div>

      <div className="grid h-[clamp(14rem,34vw,36rem)] grid-cols-3 gap-1.5 md:gap-2.5">
        {panels.map(({ photo, delay, priority }) => (
          <div key={photo.src} className="rise relative overflow-hidden bg-teal-deep" style={{ ["--d" as string]: delay }}>
            <Image src={photo.src} alt={photo.alt} fill sizes="34vw" priority={priority} className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
