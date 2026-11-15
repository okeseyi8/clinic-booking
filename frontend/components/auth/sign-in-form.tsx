"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "@/lib/auth-client";
import { signInSchema } from "@/lib/schemas";
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

export function SignInForm({ googleEnabled, onSuccess, onSwitch }: AuthFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error.issues));
    setErrors({});
    setFormError(undefined);
    setPending(true);

    const { error } = await signIn.email(parsed.data);
    setPending(false);
    if (error) {
      // One message for both cases, so the form doesn't reveal which emails have accounts.
      return setFormError(
        error.status === 401 ? "That email and password don't match. Try again or reset your password." : (error.message ?? "Something went wrong. Please try again."),
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
        <Field name="email" label="Email" type="email" autoComplete="email" placeholder="ada@example.com" error={errors.email} />
        <PasswordField
          name="password"
          label="Password"
          autoComplete="current-password"
          error={errors.password}
          hint={
            <button type="button" onClick={() => onSwitch("forgot")} className="text-sm font-semibold text-teal-ink underline-offset-4 hover:underline">
              Forgot password?
            </button>
          }
        />
        <SubmitButton pending={pending}>Log in</SubmitButton>
      </form>

      <p className="text-center text-muted-foreground">
        New to HowBody? <SwitchLink onClick={() => onSwitch("signup")}>Create an account</SwitchLink>
      </p>
    </div>
  );
}
