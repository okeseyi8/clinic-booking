import Image from "next/image";
import Link from "next/link";
import { BOOK_HREF, BOOK_LABEL, bannerPhoto } from "@/lib/site";

/** Closing call to action: mint panel with a portrait breaking out of the top edge. */
export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-32 pb-28 sm:px-6">
      <div className="reveal relative grid items-end gap-8 rounded-2xl bg-mint px-6 pt-10 sm:px-10 md:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-5 pb-10 md:pb-14">
          <h2 className="text-[clamp(2rem,4.2vw,3.2rem)] font-semibold text-teal-deep">
            Ready for a check-up that doesn&apos;t feel rushed?
          </h2>
          <p className="max-w-md text-lg text-muted-foreground">
            Pick a time with Dr Ade, Dr Bello or Dr Chukwu. Open times update live, so what you see is what you can book.
          </p>
          <Link href={BOOK_HREF} className="btn-pill btn-teal justify-self-start">
            {BOOK_LABEL}
          </Link>
        </div>
        <div className="relative h-72 md:-mt-28 md:h-[26rem]">
          <Image
            src={bannerPhoto.src}
            alt={bannerPhoto.alt}
            fill
            sizes="(min-width: 768px) 40vw, 92vw"
            className="rounded-t-2xl object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
}
