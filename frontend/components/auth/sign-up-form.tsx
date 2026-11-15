"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/schemas";
import { Field, FormAlert, GoogleButton, OrDivider, PasswordField, SubmitButton, toFieldErrors, useNextPath, type FieldErrors } from "./fields";

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const next = useNextPath();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error.issues));
    setErrors({});
    setFormError(undefined);
    setPending(true);

    // Accounts sign in straight away, so a new patient can book in the same visit.
    const { error } = await signUp.email(parsed.data);
    if (error) {
      setPending(false);
      return setFormError(
        error.code === "USER_ALREADY_EXISTS" || error.status === 422
          ? "An account with this email already exists. Log in instead, or reset your password."
          : (error.message ?? "Something went wrong. Please try again."),
      );
    }
    router.replace(next);
  }

  return (
    <div className="grid gap-6">
      {googleEnabled && (
        <>
          <GoogleButton next={next} />
          <OrDivider />
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid gap-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field name="name" label="Full name" autoComplete="name" placeholder="Ada Obi" error={errors.name} />
        <Field name="email" label="Email" type="email" autoComplete="email" placeholder="ada@example.com" error={errors.email} />
        <PasswordField name="password" label="Password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password} />
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>

      <p className="text-center text-muted-foreground">
        Already have an account?{" "}
        <Link href={next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`} className="font-semibold text-teal-ink underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
