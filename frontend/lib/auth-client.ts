import { createAuthClient } from "better-auth/react";

/** Browser-side auth client. Same origin, so no base URL is needed. */
export const authClient = createAuthClient();
export const { useSession, signIn, signUp, signOut } = authClient;
