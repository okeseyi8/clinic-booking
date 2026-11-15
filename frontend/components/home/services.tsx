import Image from "next/image";
import { Baby, FlaskConical, HandHeart, HeartPulse, Stethoscope, Syringe, type LucideIcon } from "lucide-react";
import { services, type Service } from "@/lib/site";

const icons: Record<Service["icon"], LucideIcon> = {
  stethoscope: Stethoscope,
  baby: Baby,
  syringe: Syringe,
  heart: HeartPulse,
  flask: FlaskConical,
  hand: HandHeart,
};

export function Services() {
  return (
    <section id="services" className="scroll-mt-6 bg-muted/60 py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6">
        <div className="mx-auto grid max-w-2xl gap-4 text-center">
          <h2 className="text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold">Everything your family needs, under one roof</h2>
          <p className="text-lg text-muted-foreground">
            One practice for check-ups, children, vaccines, women&apos;s health, tests and long-term care.
          </p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = icons[service.icon];
            return (
              <li key={service.title} className="reveal group overflow-hidden rounded-2xl bg-card">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={service.photo.src}
                    alt={service.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-[1.04]"
                  />
                </div>
                {/* The card body scallops up into the photo, echoing the section edges. */}
                <div className="scallop-t grid gap-2 px-6 pt-2 pb-7 [--edge:var(--card)] [--scallop:14px]">
                  <span className="relative z-2 -mt-9 mb-2 grid size-12 place-items-center rounded-full bg-teal text-on-dark ring-4 ring-card">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                  <p className="text-muted-foreground">{service.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
