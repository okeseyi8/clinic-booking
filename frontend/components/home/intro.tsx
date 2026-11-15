import Image from "next/image";
import { Timer } from "lucide-react";
import { introPhotos } from "@/lib/site";

/** Brand statement followed by an offset photo collage and one honest product fact. */
export function Intro() {
  return (
    <section className="mx-auto grid max-w-7xl gap-14 px-4 pt-28 pb-24 sm:px-6">
      <div className="grid gap-6 md:grid-cols-[12rem_1fr] md:gap-10">
        <p className="font-medium text-teal-ink md:pt-3">For every body in the house</p>
        <p className="reveal font-display text-[clamp(1.6rem,3.2vw,2.6rem)] leading-[1.25] font-medium text-foreground">
          At HowBody, good care starts with time and trust.{" "}
          <span className="text-muted-foreground">
            From a toddler&apos;s first fever to a grandparent&apos;s blood pressure, our doctors get to know your
            family and stay with you, visit after visit.
          </span>
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_1.3fr] lg:grid-cols-[0.9fr_1.25fr_1fr] lg:items-end">
        <div className="reveal relative aspect-[4/5] overflow-hidden rounded-2xl lg:-mb-10">
          <Image src={introPhotos.first.src} alt={introPhotos.first.alt} fill sizes="(min-width: 1024px) 28vw, 45vw" className="object-cover" />
        </div>
        <div className="reveal relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image src={introPhotos.second.src} alt={introPhotos.second.alt} fill sizes="(min-width: 1024px) 38vw, 55vw" className="object-cover" />
        </div>
        <div className="reveal grid content-between gap-8 rounded-2xl bg-mint p-7 sm:col-span-2 lg:col-span-1 lg:min-h-80">
          <span className="grid size-12 place-items-center rounded-full bg-teal text-on-dark">
            <Timer className="size-6" aria-hidden />
          </span>
          <div className="grid gap-2">
            <p className="font-display text-3xl font-semibold text-teal-deep">Book in under a minute</p>
            <p className="text-muted-foreground">
              Pick a doctor and an open time, add your name and email, and you&apos;re confirmed. No phone queue.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
