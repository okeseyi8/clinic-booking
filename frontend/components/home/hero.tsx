import Image from "next/image";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { BOOK_HREF, BOOK_LABEL, heroPhotos } from "@/lib/site";

export function Hero() {
  return (
    <section className="scallop-b bg-teal text-on-dark [--edge:var(--teal)]">
      <SiteHeader />

      <div className="mx-auto grid max-w-7xl justify-items-center gap-6 px-4 pt-10 pb-12 text-center sm:px-6 md:pt-14">
        <h1 className="rise max-w-3xl text-[clamp(2.75rem,7vw,5.25rem)] font-semibold">
          Care that knows you by name.
        </h1>
        <p className="rise max-w-xl text-lg text-on-dark-muted [--d:120ms] md:text-xl">
          A family practice for every age. See today&apos;s open times and book your visit in under a minute.
        </p>
        <Link href={BOOK_HREF} className="rise btn-pill btn-light [--d:220ms]">
          <CalendarCheck className="size-5" aria-hidden />
          {BOOK_LABEL}
        </Link>
      </div>

      {/* Three-photo strip: a wide centre frame between two taller portrait frames, bottoms aligned. */}
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_1.35fr_1fr] items-end gap-3 px-4 pb-14 sm:gap-5 sm:px-6">
        <PhotoFrame {...heroPhotos.left} className="aspect-[4/5] [--d:300ms] max-sm:aspect-[3/4]" sizes="30vw" />
        <PhotoFrame {...heroPhotos.center} className="aspect-[5/4] [--d:380ms] max-sm:aspect-[3/4]" sizes="40vw" priority />
        <PhotoFrame {...heroPhotos.right} className="aspect-[4/5] [--d:460ms] max-sm:aspect-[3/4]" sizes="30vw" />
      </div>
    </section>
  );
}

function PhotoFrame({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className={`rise relative overflow-hidden rounded-2xl bg-teal-deep ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
