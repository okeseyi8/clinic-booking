"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { testimonials } from "@/lib/site";

/** One patient story at a time: photo and quote side by side, manual controls, no autoplay. */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const story = testimonials[index]!;
  const go = (step: number) => setIndex((i) => (i + step + testimonials.length) % testimonials.length);

  return (
    <section className="bg-muted/60 py-24" aria-roledescription="carousel" aria-label="Patient stories">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6">
        <h2 className="mx-auto max-w-2xl text-center text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold">
          Trusted by families across Lagos
        </h2>

        <div className="grid gap-5 md:grid-cols-[1fr_1.15fr]">
          <div key={story.photo.src} className="fade-swap relative aspect-[4/3] overflow-hidden rounded-2xl md:aspect-auto md:min-h-96">
            <Image src={story.photo.src} alt={story.photo.alt} fill sizes="(min-width: 768px) 45vw, 92vw" className="object-cover" />
          </div>

          <figure className="grid content-between gap-10 rounded-2xl bg-card p-8 md:p-10" aria-live="polite">
            <Quote className="size-10 text-teal" aria-hidden />
            <blockquote key={story.quote} className="fade-swap font-display text-[clamp(1.5rem,2.6vw,2.1rem)] leading-snug font-medium">
              &ldquo;{story.quote}&rdquo;
            </blockquote>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <figcaption className="grid">
                <span className="font-semibold">{story.name}</span>
                <span className="text-muted-foreground">{story.detail}</span>
              </figcaption>
              <div className="flex items-center gap-2">
                <span className="mr-2 text-sm text-muted-foreground tabular-nums">
                  {index + 1} of {testimonials.length}
                </span>
                <button type="button" onClick={() => go(-1)} aria-label="Previous story" className="btn-pill size-12 px-0 ring-1 ring-border hover:bg-mint">
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button type="button" onClick={() => go(1)} aria-label="Next story" className="btn-pill btn-teal size-12 px-0">
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
