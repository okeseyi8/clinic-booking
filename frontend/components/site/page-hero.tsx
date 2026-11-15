import { SiteHeader } from "./site-header";

/** Compact teal band for inner pages, with the brand's scalloped edge. */
export function PageHero({ title, description }: { title: string; description?: string }) {
  return (
    <section className="scallop-b bg-teal text-on-dark [--edge:var(--teal)]">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-3 px-4 pt-8 pb-14 sm:px-6 md:pt-12">
        <h1 className="rise text-[clamp(2.4rem,5.5vw,4rem)] font-semibold">{title}</h1>
        {description && <p className="rise max-w-xl text-lg text-on-dark-muted [--d:100ms]">{description}</p>}
      </div>
    </section>
  );
}
