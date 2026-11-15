import Image from "next/image";
import { CalendarClock, MessagesSquare, UserRoundCheck, UsersRound, type LucideIcon } from "lucide-react";
import { reasons, whyPhoto } from "@/lib/site";

const reasonIcons: LucideIcon[] = [CalendarClock, UserRoundCheck, MessagesSquare, UsersRound];

/** Dark story block: reasons on the left, one strong photo on the right. */
export function WhyUs() {
  return (
    <section className="scallop-t scallop-b bg-night text-on-dark [--edge:var(--night)]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="grid gap-10">
          <div className="grid gap-4">
            <h2 className="text-[clamp(2.1rem,4.5vw,3.4rem)] font-semibold">Why families choose HowBody</h2>
            <p className="max-w-lg text-lg leading-relaxed text-on-dark-muted">
              We built the practice we wanted for our own parents and kids: easy to reach, never rushed, and personal.
            </p>
          </div>

          <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {reasons.map((reason, i) => {
              const Icon = reasonIcons[i] ?? UsersRound;
              return (
                <li key={reason.title} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="grid size-11 place-items-center rounded-full bg-night-soft text-mint-strong">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="grid gap-1">
                    <h3 className="font-sans text-lg font-semibold tracking-normal">{reason.title}</h3>
                    <p className="leading-relaxed text-on-dark-muted">{reason.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="reveal relative aspect-[4/5] overflow-hidden rounded-2xl lg:aspect-[5/6]">
          <Image src={whyPhoto.src} alt={whyPhoto.alt} fill sizes="(min-width: 1024px) 45vw, 92vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
