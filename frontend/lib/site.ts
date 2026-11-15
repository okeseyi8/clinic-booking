/**
 * HowBody site content. Photos are free-licence Pexels images, served from their CDN
 * through next/image. Each ID was checked to resolve and hand-picked for its subject.
 */

// Ask the CDN for a compressed copy capped at 1600px wide (about 200 KB instead of about 3 MB originals),
// so next/image optimises from a small source and cold loads stay fast.
export const pexels = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

export interface Photo {
  src: string;
  alt: string;
}

const photo = (id: number, alt: string): Photo => ({ src: pexels(id), alt });

export const BOOK_HREF = "/#book";
export const BOOK_LABEL = "Book a visit";

export const CONTACT = {
  phone: "+234 809 214 7730",
  phoneHref: "tel:+2348092147730",
  email: "care@howbody.clinic",
  address: "14 Admiralty Way, Lekki Phase 1, Lagos",
  hours: "Mon to Sat, 8am to 6pm",
};

export const heroPhotos = {
  left: photo(7653108, "A doctor listening to a smiling girl's breathing with a stethoscope"),
  center: photo(7578806, "A HowBody doctor laughing with a patient during a consultation"),
  right: photo(5215000, "A doctor checking a woman's blood pressure at a sunny desk"),
};

export const introPhotos = {
  first: photo(7653110, "A doctor going through results with a mother and her daughter"),
  second: photo(5240498, "A father and his laughing son outdoors"),
};

export interface Service {
  title: string;
  body: string;
  icon: "stethoscope" | "baby" | "syringe" | "heart" | "flask" | "hand";
  photo: Photo;
}

export const services: Service[] = [
  {
    title: "Check-ups & GP visits",
    body: "Unrushed appointments for new symptoms, ongoing questions and yearly health checks.",
    icon: "stethoscope",
    photo: photo(6129688, "A nurse taking a patient's blood pressure in a bright room"),
  },
  {
    title: "Children's health",
    body: "Growth checks, coughs, rashes and fevers, seen by doctors who are good with kids.",
    icon: "baby",
    photo: photo(5998446, "A doctor listening to a young girl's chest at a small table"),
  },
  {
    title: "Vaccinations",
    body: "Childhood schedules, travel jabs and seasonal flu shots, with records kept for you.",
    icon: "syringe",
    photo: photo(3992931, "A cheerful girl getting a plaster after her vaccination"),
  },
  {
    title: "Women's health",
    body: "Pregnancy care, contraception and screening, in a private and relaxed setting.",
    icon: "heart",
    photo: photo(7089037, "A pregnant woman talking with her doctor beside an ultrasound machine"),
  },
  {
    title: "Lab tests",
    body: "Blood work and screening on site, with results explained by your own doctor.",
    icon: "flask",
    photo: photo(6622519, "A rack of labelled blood sample tubes in the clinic lab"),
  },
  {
    title: "Senior care",
    body: "Long-term conditions, medication reviews and home-friendly care plans for older patients.",
    icon: "hand",
    photo: photo(3934328, "A doctor gently holding an older patient's hand"),
  },
];

export const whyPhoto = photo(6303643, "A doctor talking through a care plan with a patient");

export const reasons = [
  {
    title: "Same-week appointments",
    body: "Open times are shown live below, so you can see a slot and take it.",
  },
  {
    title: "One doctor who knows you",
    body: "You see the same GP each visit, so you never start your story from scratch.",
  },
  {
    title: "Time to talk",
    body: "Appointments are long enough for questions, not just a prescription.",
  },
  {
    title: "Care for every age",
    body: "Babies, teenagers, parents and grandparents, all under one roof.",
  },
];

export interface Doctor {
  name: string;
  role: string;
  bio: string;
  photo: Photo;
}

/** Names match the providers whose slots the booking API serves. */
export const doctors: Doctor[] = [
  {
    name: "Dr Ade",
    role: "Family physician",
    bio: "Looks after whole families, from first vaccines to grandparents' check-ups.",
    photo: photo(19963165, "Portrait of Dr Ade in a white coat with a stethoscope"),
  },
  {
    name: "Dr Bello",
    role: "General practitioner",
    bio: "Focuses on long-term conditions like blood pressure and diabetes.",
    photo: photo(13156759, "Portrait of Dr Bello, arms folded, in a white clinic coat"),
  },
  {
    name: "Dr Chukwu",
    role: "Senior GP",
    bio: "Twenty years in general practice, with a soft spot for senior care.",
    photo: photo(8460159, "Portrait of Dr Chukwu smiling outside the clinic"),
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  detail: string;
  photo: Photo;
}

export const testimonials: Testimonial[] = [
  {
    quote: "Booked at 7am, seen at 10. Dr Ade spent real time with my son and explained everything twice.",
    name: "Tunde Bakare",
    detail: "Father of two, Lekki",
    photo: photo(5082634, "Tunde and his son hugging and smiling at the camera"),
  },
  {
    quote: "For the first time, I left a clinic understanding my results. I didn't feel rushed at all.",
    name: "Ifeoma Nwosu",
    detail: "Patient since 2023",
    photo: photo(4982473, "Ifeoma smiling in warm sunlight"),
  },
  {
    quote: "Our whole family sees the same doctor now. The kids actually look forward to check-ups.",
    name: "Amaka Eze",
    detail: "Mother of two, Ikoyi",
    photo: photo(30098659, "Amaka with her two sons in a family portrait"),
  },
];

export const contactPhoto = photo(6129678, "A nurse checking a patient's blood pressure at the bedside");
export const bannerPhoto = photo(18844981, "A HowBody nurse laughing in green scrubs");
