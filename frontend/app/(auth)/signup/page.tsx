import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { googleEnabled } from "@/lib/auth";

export const metadata = { title: "Create account · HowBody" };

export default function SignUpPage() {
  return (
    <AuthShell title="Create your account" description="One account for the whole family's visits. It takes less than a minute.">
      <Suspense>
        <SignUpForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
