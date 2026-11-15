import Image from "next/image";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { BOOK_HREF, BOOK_LABEL, heroPhotos } from "@/lib/site";

/*
 * Edge-to-edge photo strip, measured from the brand reference:
 * - left and right panels fill the outer thirds. Their inner edges lean inward and their
 *   bottoms dip toward the centre, so teal wedges show between the panels.
 * - the centre panel is a plain rectangle that starts ~14% lower than the sides.
 * - teal scallops hang over the top of the strip, and a teal band with scallops closes it below.
 * Clip paths are relative to each panel's own box.
 */
const panels = [
  {
    photo: heroPhotos.left,
    box: "left-0 top-0 bottom-0 w-[33.2%]",
    clip: "polygon(0 0, 100% 0, 85% 98.5%, 0 87%)",
    delay: "200ms",
  },
  {
    photo: heroPhotos.center,
    box: "left-[33.2%] top-[14.4%] bottom-0 w-[33.5%]",
    clip: undefined,
    delay: "280ms",
    priority: true,
  },
  {
    photo: heroPhotos.right,
    box: "right-0 top-0 bottom-0 w-[33.3%]",
    clip: "polygon(0 0, 100% 0, 100% 88%, 15.3% 99%)",
    delay: "360ms",
  },
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

      <div className="relative h-[clamp(15rem,37.7vw,40rem)]">
        {panels.map(({ photo, box, clip, delay, priority }) => (
          <div
            key={photo.src}
            className={`rise absolute overflow-hidden bg-teal-deep ${box}`}
            style={{ clipPath: clip, ["--d" as string]: delay }}
          >
            <Image src={photo.src} alt={photo.alt} fill sizes="34vw" priority={priority} className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
