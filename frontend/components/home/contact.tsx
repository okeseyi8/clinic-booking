"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { z } from "zod";
import { CONTACT, contactPhoto } from "@/lib/site";

const messageSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name"),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  message: z.string().trim().min(10, "Add a few words so we can help"),
});
type Fields = z.infer<typeof messageSchema>;

const inputClass =
  "h-12 w-full rounded-xl bg-night-soft px-4 text-on-dark ring-1 ring-on-dark/15 placeholder:text-on-dark-muted/80 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-mint-strong aria-invalid:ring-2 aria-invalid:ring-[oklch(0.75_0.14_25)]";

/**
 * There is no messaging backend, so the form does not pretend to send anything.
 * It opens the visitor's email app with the message filled in, addressed to the clinic.
 */
export function Contact() {
  const [values, setValues] = useState<Fields>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = messageSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ name: flat.name?.[0], email: flat.email?.[0], message: flat.message?.[0] });
      return;
    }
    setErrors({});
    const { name, email, message } = parsed.data;
    const body = `${message}\n\n${name}\n${email}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Question from ${name}`)}&body=${encodeURIComponent(body)}`;
  }

  const bind = (name: keyof Fields) => ({
    id: `contact-${name}`,
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value })),
    "aria-invalid": Boolean(errors[name]) || undefined,
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });

  const details = [
    { icon: Phone, label: CONTACT.phone, href: CONTACT.phoneHref },
    { icon: Mail, label: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { icon: MapPin, label: CONTACT.address },
    { icon: Clock, label: CONTACT.hours },
  ];

  return (
    <section id="contact" className="scallop-t scallop-b scroll-mt-6 bg-night text-on-dark [--edge:var(--night)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-24 sm:px-6 lg:grid-cols-2">
        <div className="relative grid min-h-[28rem] content-end overflow-hidden rounded-2xl p-6 sm:p-8">
          <Image src={contactPhoto.src} alt={contactPhoto.alt} fill sizes="(min-width: 1024px) 45vw, 92vw" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-night via-night/70 to-night/10" />
          <div className="relative grid gap-6">
            <h2 className="max-w-md text-[clamp(2.1rem,4.5vw,3.2rem)] font-semibold">Talk to our care team</h2>
            <ul className="grid gap-3">
              {details.map(({ icon: Icon, label, href }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-on-dark/15">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {href ? (
                    <a href={href} className="underline-offset-4 hover:underline">
                      {label}
                    </a>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid content-start gap-5 rounded-2xl bg-night-soft/50 p-6 ring-1 ring-on-dark/10 sm:p-8">
          <div className="grid gap-1">
            <p className="font-display text-2xl font-semibold">Send us a question</p>
            <p className="text-on-dark-muted">For bookings, use the open times above. For anything else, write to us here.</p>
          </div>

          <Field label="Your name" name="name" error={errors.name}>
            <input autoComplete="name" className={inputClass} {...bind("name")} />
          </Field>
          <Field label="Email" name="email" error={errors.email}>
            <input type="email" autoComplete="email" className={inputClass} {...bind("email")} />
          </Field>
          <Field label="How can we help?" name="message" error={errors.message}>
            <textarea rows={5} className={`${inputClass} h-auto resize-y py-3`} {...bind("message")} />
          </Field>

          <button type="submit" className="btn-pill btn-light justify-self-start">
            <Send className="size-4" aria-hidden />
            Write to us
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={`contact-${name}`} className="font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`contact-${name}-error`} className="text-sm text-[oklch(0.82_0.1_25)]">
          {error}
        </p>
      )}
    </div>
  );
}
