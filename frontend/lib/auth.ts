import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { MongoClient } from "mongodb";
import { resetPasswordEmail, sendMail } from "./mail";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI must be set for authentication");

// One client per server instance. In dev, hot reload re-runs this module, so the client is kept on globalThis.
const globalForMongo = globalThis as unknown as { authMongo?: MongoClient };
const client = globalForMongo.authMongo ?? new MongoClient(uri);
if (process.env.NODE_ENV !== "production") globalForMongo.authMongo = client;

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }
    : undefined;

/**
 * Accounts live in their own database ("howbody_auth"), separate from the booking API's data.
 * Better Auth reads BETTER_AUTH_SECRET and BETTER_AUTH_URL from the environment.
 */
export const auth = betterAuth({
  // Atlas supports transactions. A standalone local mongod doesn't, so dev can opt out with MONGODB_TRANSACTIONS=false.
  database: mongodbAdapter(client.db("howbody_auth"), { client, transaction: process.env.MONGODB_TRANSACTIONS !== "false" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({ to: user.email, ...resetPasswordEmail(user.name, url) });
    },
  },
  socialProviders: google ? { google } : {},
  // BETTER_AUTH_URL is always trusted. In dev, also accept the usual local ports so `next dev` works on any of them.
  trustedOrigins: process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000", "http://localhost:3100"],
  // Shared across serverless instances, like the booking API's own limiter.
  rateLimit: { storage: "database" },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
