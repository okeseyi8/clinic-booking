import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata = { title: "Choose a new password · HowBody" };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" description="Pick something you don't use anywhere else.">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
