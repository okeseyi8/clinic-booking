import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { heroPhotos } from "@/lib/site";

/**
 * Split layout for the account pages: a teal photo panel on large screens,
 * and a compact teal band with the brand's scalloped edge on small ones.
 */
export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-teal text-on-dark lg:block">
        <Image src={heroPhotos.center.src} alt={heroPhotos.center.alt} fill sizes="45vw" priority className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.21_0.022_205/0.85),oklch(0.21_0.022_205/0.1)_55%)]" />
        <Logo className="absolute top-8 left-8" />
        <figure className="absolute right-10 bottom-10 left-10 grid max-w-md gap-3">
          <blockquote className="font-display text-3xl leading-tight font-medium">&ldquo;Booking takes a minute, and the doctor already knows our history.&rdquo;</blockquote>
          <figcaption className="text-on-dark-muted">Ngozi, mum of three</figcaption>
        </figure>
      </aside>

      <div className="flex flex-col">
        <div className="scallop-b bg-teal px-4 py-5 [--edge:var(--teal)] sm:px-6 lg:hidden">
          <Logo />
        </div>

        <div className="flex justify-end px-4 pt-10 sm:px-6 lg:pt-8 lg:pr-10">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-teal-ink underline-offset-4 hover:underline">
            <ArrowLeft className="size-4" aria-hidden />
            Back to HowBody
          </Link>
        </div>

        <main className="grid flex-1 place-items-center px-4 pt-6 pb-16 sm:px-6">
          <div className="rise grid w-full max-w-md gap-8">
            <div className="grid gap-2">
              <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-semibold">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
