"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { heroPhotos } from "@/lib/site";
import type { AuthView } from "./fields";
import { ForgotPasswordForm } from "./password-reset-forms";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

interface OpenAuthOptions {
  view?: AuthView;
  /** Replaces the default heading text, e.g. to say which slot the user is about to book. */
  description?: string;
  /** Runs after email/password sign-in or sign-up. Google sign-in redirects back to the current page instead. */
  onSuccess?: () => void;
}

const AuthDialogContext = createContext<((options?: OpenAuthOptions) => void) | null>(null);

/** Opens the log in / sign up modal from anywhere in the app. */
export function useAuthDialog() {
  const open = useContext(AuthDialogContext);
  if (!open) throw new Error("useAuthDialog must be used inside <AuthDialogProvider>");
  return open;
}

const COPY: Record<AuthView, { title: string; description: string }> = {
  login: { title: "Welcome back", description: "Log in to book a visit and manage your appointments." },
  signup: { title: "Create your account", description: "One account for the whole family's visits. It takes less than a minute." },
  forgot: { title: "Forgot your password?", description: "Enter the email on your account and we'll send you a link to choose a new one." },
};

export function AuthDialogProvider({ googleEnabled, children }: { googleEnabled: boolean; children: ReactNode }) {
  const [state, setState] = useState<(OpenAuthOptions & { view: AuthView }) | null>(null);

  const open = useCallback((options: OpenAuthOptions = {}) => setState({ ...options, view: options.view ?? "login" }), []);
  const close = () => setState(null);
  const switchTo = (view: AuthView) => setState((s) => s && { ...s, view });
  const succeed = () => {
    const onSuccess = state?.onSuccess;
    close();
    onSuccess?.();
  };

  const view = state?.view ?? "login";
  const copy = COPY[view];
  const formProps = { googleEnabled, onSuccess: succeed, onSwitch: switchTo };

  return (
    <AuthDialogContext.Provider value={open}>
      {children}
      <Suspense>
        <OpenFromUrl open={open} />
      </Suspense>
      <Dialog open={state !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <div className="grid max-h-[calc(100dvh-2rem)] overflow-y-auto md:grid-cols-[0.9fr_1fr]">
            <aside className="relative hidden min-h-[36rem] bg-teal text-on-dark md:block">
              <Image src={heroPhotos.center.src} alt="" fill sizes="400px" className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.21_0.022_205/0.85),oklch(0.21_0.022_205/0.05)_55%)]" />
              <figure className="absolute right-8 bottom-8 left-8 grid gap-2">
                <blockquote className="font-display text-2xl leading-tight font-medium">
                  &ldquo;Booking takes a minute, and the doctor already knows our history.&rdquo;
                </blockquote>
                <figcaption className="text-sm text-on-dark-muted">Ngozi, mum of three</figcaption>
              </figure>
            </aside>

            <div className="grid content-center gap-7 px-6 pt-12 pb-8 sm:px-10">
              <div className="grid gap-2">
                <DialogTitle className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-semibold">{copy.title}</DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  {view === "forgot" ? copy.description : (state?.description ?? copy.description)}
                </DialogDescription>
              </div>
              {/* key resets each form's local state when switching views. */}
              {view === "login" && <SignInForm key="login" {...formProps} />}
              {view === "signup" && <SignUpForm key="signup" {...formProps} />}
              {view === "forgot" && <ForgotPasswordForm key="forgot" onSwitch={switchTo} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  );
}

/**
 * Opens the modal from a link: /?auth=login | signup | forgot (used by the reset-password page),
 * or ?auth=google-error when Google sign-in is cancelled or fails. The param is removed afterwards.
 */
function OpenFromUrl({ open }: { open: (options?: OpenAuthOptions) => void }) {
  const param = useSearchParams().get("auth");
  useEffect(() => {
    if (!param) return;
    if (param === "login" || param === "signup" || param === "forgot") open({ view: param });
    if (param === "google-error") open({ view: "login", description: "Google sign-in didn't finish. Please try again, or log in with your email." });
    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    window.history.replaceState(null, "", url);
  }, [param, open]);
  return null;
}
