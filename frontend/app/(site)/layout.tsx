import { SiteFooter } from "@/components/site/site-footer";

/** Marketing and booking pages share the footer. Auth pages use their own, quieter layout. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
