"use client";

import { useState, type FormEvent } from "react";
import { signUp } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/schemas";
import {
  Field,
  FormAlert,
  GoogleButton,
  OrDivider,
  PasswordField,
  SubmitButton,
  SwitchLink,
  toFieldErrors,
  type AuthFormProps,
  type FieldErrors,
} from "./fields";

export function SignUpForm({ googleEnabled, onSuccess, onSwitch }: AuthFormProps) {
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
    setPending(false);
    if (error) {
      return setFormError(
        error.status === 422
          ? "An account with this email already exists. Log in instead, or reset your password."
          : (error.message ?? "Something went wrong. Please try again."),
      );
    }
    onSuccess();
  }

  return (
    <div className="grid gap-6">
      {googleEnabled && (
        <>
          <GoogleButton />
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
        Already have an account? <SwitchLink onClick={() => onSwitch("login")}>Log in</SwitchLink>
      </p>
    </div>
  );
}
