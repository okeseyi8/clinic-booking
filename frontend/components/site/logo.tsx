import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Wordmark: "HowBody" in the display face, with a plus mark in a mint disc. */
export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <Link
      href="/"
      aria-label="HowBody home"
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-display text-2xl font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/60",
        tone === "light" ? "text-on-dark" : "text-teal-deep",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-8 place-items-center rounded-full",
          tone === "light" ? "bg-mint-strong text-teal-deep" : "bg-teal text-on-dark",
        )}
      >
        <Plus className="size-5" strokeWidth={3} />
      </span>
      HowBody
    </Link>
  );
}
