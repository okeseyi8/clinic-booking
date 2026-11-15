import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { googleEnabled } from "@/lib/auth";

export const metadata = { title: "Log in · HowBody" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" description="Log in to book a visit and manage your appointments.">
      {/* The form reads ?next= from the URL, which needs a Suspense boundary under Cache Components. */}
      <Suspense>
        <SignInForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
