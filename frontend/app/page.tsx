import { Hero } from "@/components/home/hero";
import { Intro } from "@/components/home/intro";
import { Services } from "@/components/home/services";
import { BookingSection } from "@/components/home/booking-section";
import { WhyUs } from "@/components/home/why-us";
import { Doctors } from "@/components/home/doctors";
import { Testimonials } from "@/components/home/testimonials";
import { Contact } from "@/components/home/contact";
import { CtaBanner } from "@/components/home/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <Services />
      <BookingSection />
      <WhyUs />
      <Doctors />
      <Testimonials />
      <Contact />
      <CtaBanner />
    </>
  );
}
