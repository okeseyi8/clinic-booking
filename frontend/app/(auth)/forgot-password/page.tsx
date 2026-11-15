import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata = { title: "Reset password · HowBody" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot your password?" description="Enter the email on your account and we'll send you a link to choose a new one.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
