"use client";

import { useState } from "react";
import Image from "next/image";
import { doctors } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Accordion portrait strip: one doctor is open at a time, and hover or keyboard
 * focus opens another. On small screens every portrait is shown open, stacked.
 */
export function Doctors() {
  const [active, setActive] = useState(0);

  return (
    <section id="doctors" className="scroll-mt-6 mx-auto grid max-w-7xl gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[0.8fr_1.4fr] lg:items-center">
      <div className="grid gap-4">
        <h2 className="text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold">Doctors who know your name</h2>
        <p className="max-w-md text-lg text-muted-foreground">
          Three GPs, one shared approach: listen first, explain clearly, and follow up. Choose any of them when you
          book.
        </p>
      </div>

      <ul className="grid gap-4 md:flex md:h-[30rem]">
        {doctors.map((doctor, i) => {
          const open = i === active;
          return (
            <li
              key={doctor.name}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "relative min-h-96 overflow-hidden rounded-2xl bg-teal-deep transition-[flex-grow] duration-700 ease-(--ease-out-expo) motion-reduce:transition-none md:min-h-0 md:basis-0",
                open ? "md:grow-[2.6]" : "md:grow",
              )}
            >
              <button
                type="button"
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-expanded={open}
                aria-label={`${doctor.name}, ${doctor.role}`}
                className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
              />
              <Image
                src={doctor.photo.src}
                alt={doctor.photo.alt}
                fill
                sizes="(min-width: 768px) 40vw, 92vw"
                className="object-cover object-top"
              />
              <div
                className={cn(
                  "absolute inset-x-3 bottom-3 grid gap-1 rounded-xl bg-night/85 p-4 text-on-dark transition-opacity duration-500 motion-reduce:transition-none",
                  open ? "opacity-100" : "md:opacity-0",
                )}
              >
                <p className="font-display text-xl font-semibold">{doctor.name}</p>
                <p className="text-sm font-medium text-mint-strong">{doctor.role}</p>
                <p className="text-sm leading-relaxed text-on-dark-muted">{doctor.bio}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
