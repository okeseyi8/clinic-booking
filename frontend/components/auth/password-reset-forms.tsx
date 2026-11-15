"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/schemas";
import { Field, FormAlert, PasswordField, SubmitButton, SwitchLink, toFieldErrors, type AuthView, type FieldErrors } from "./fields";

export function ForgotPasswordForm({ onSwitch }: { onSwitch: (view: AuthView) => void }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error.issues));
    setErrors({});
    setFormError(undefined);
    setPending(true);

    const { error } = await authClient.requestPasswordReset({ email: parsed.data.email, redirectTo: "/reset-password" });
    setPending(false);
    if (error) return setFormError(error.status === 429 ? "Too many requests. Please wait a minute and try again." : "We couldn't send the email. Please try again.");
    setSentTo(parsed.data.email);
  }

  if (sentTo) {
    // Same message whether or not the account exists, so this page can't be used to find accounts.
    return (
      <div className="grid gap-5">
        <div className="grid justify-items-start gap-3 rounded-2xl bg-mint p-6 text-teal-deep">
          <MailCheck className="size-7" aria-hidden />
          <p className="font-display text-xl font-semibold">Check your inbox</p>
          <p>
            If there&apos;s an account for <span className="font-semibold">{sentTo}</span>, we&apos;ve sent a link to choose a new
            password. It expires in 1 hour. Check your spam folder if it isn&apos;t there in a minute.
          </p>
        </div>
        <p className="text-center text-muted-foreground">
          <SwitchLink onClick={() => onSwitch("login")}>Back to log in</SwitchLink>
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} noValidate className="grid gap-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field name="email" label="Email" type="email" autoComplete="email" placeholder="ada@example.com" error={errors.email} autoFocus />
        <SubmitButton pending={pending}>Send reset link</SubmitButton>
      </form>
      <p className="text-center text-muted-foreground">
        Remembered it? <SwitchLink onClick={() => onSwitch("login")}>Log in</SwitchLink>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  // Better Auth sends people here with ?error=INVALID_TOKEN when the link is expired or already used.
  if (!token || params.get("error")) {
    return (
      <div className="grid gap-5">
        <FormAlert>This reset link has expired or was already used. Ask for a new one and use it within an hour.</FormAlert>
        <Link href="/?auth=forgot" className="btn-pill btn-teal">
          Get a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="success">Your password has been changed. For your safety, you&apos;ve been signed out on other devices.</FormAlert>
        <Link href="/?auth=login" className="btn-pill btn-teal">
          Log in with your new password
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error.issues));
    setErrors({});
    setFormError(undefined);
    setPending(true);

    const { error } = await authClient.resetPassword({ newPassword: parsed.data.password, token: token! });
    setPending(false);
    if (error) {
      return setFormError(
        error.status === 400 ? "This reset link has expired or was already used. Ask for a new one." : (error.message ?? "Something went wrong. Please try again."),
      );
    }
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      {formError && <FormAlert>{formError}</FormAlert>}
      <PasswordField name="password" label="New password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password} autoFocus />
      <PasswordField name="confirm" label="Confirm new password" autoComplete="new-password" error={errors.confirm} />
      <SubmitButton pending={pending}>Save new password</SubmitButton>
    </form>
  );
}
