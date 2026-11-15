"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/** Field errors keyed by input name, from a failed zod parse. */
export type FieldErrors = Record<string, string | undefined>;

export function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) errors[String(issue.path[0])] ??= issue.message;
  return errors;
}

/**
 * Where to send the user after auth. Only same-site paths are allowed, so a crafted
 * link like /login?next=https://evil.example can't bounce users off the site.
 */
export function useNextPath() {
  const next = useSearchParams().get("next");
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

type FieldProps = React.ComponentProps<"input"> & { name: string; label: string; error?: string; hint?: React.ReactNode };

export function Field({ name, label, error, hint, className, ...props }: FieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={name}>{label}</Label>
        {hint}
      </div>
      <Input
        id={name}
        name={name}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={className}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Password input with a show/hide toggle, so people can check what they typed on a phone. */
export function PasswordField(props: Omit<FieldProps, "type">) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      <Field {...props} type={visible ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-[1.875rem] grid size-9 place-items-center rounded-full text-muted-foreground outline-none hover:bg-mint hover:text-teal-deep focus-visible:ring-3 focus-visible:ring-ring/60"
      >
        <Icon className="size-4.5" aria-hidden />
      </button>
    </div>
  );
}

export function FormAlert({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "success" }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-xl p-3.5 text-sm",
        tone === "error" ? "bg-destructive/8 text-destructive" : "bg-mint text-teal-deep",
      )}
    >
      {tone === "error" && <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <span>{children}</span>
    </p>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={pending} className="btn-pill btn-teal w-full disabled:opacity-70">
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** "Continue with Google". Uses Google's own four-colour mark, as their branding rules require. */
export function GoogleButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const { error } = await signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: "/login?error=google" });
        if (error) setPending(false);
      }}
      className="btn-pill w-full bg-card text-foreground ring-1 ring-input hover:bg-mint disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
      )}
      Continue with Google
    </button>
  );
}
