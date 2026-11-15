import type { Metadata } from "next";
import { Figtree, Fredoka } from "next/font/google";
import { Providers } from "./providers";
import { SiteFooter } from "@/components/site/site-footer";
import "./globals.css";

// Display: Fredoka's soft, rounded forms carry the friendly brand voice.
// Body: Figtree is a clear, open sans that stays readable at small sizes for older patients.
const display = Fredoka({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600"] });
const body = Figtree({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HowBody · Family & general practice",
  description: "A family practice for every age in Lagos. See open appointment times and book your visit in under a minute.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
