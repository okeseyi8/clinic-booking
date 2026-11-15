import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Backend-for-frontend proxy.
 *
 * The booking API requires a secret X-API-Key. Shipping that key to the browser
 * would make it public, so the browser calls /api/* on this Next.js server and
 * we attach the key here, server-side.
 *
 * Only the routes the UI needs are allowed through. Admin routes such as
 * POST /reset are never reachable from the public site.
 *
 * Accounts: anyone can browse slots, but every bookings route needs a signed-in user.
 * The booking API itself stays exactly as specified (name + email in the body), so the
 * proxy fills those in from the session and scopes reads and cancels to the user's own email.
 * The browser can't book or look up bookings under someone else's address.
 */
const ALLOWED_ROUTES: ReadonlyArray<readonly [method: string, path: RegExp]> = [
  ["GET", /^slots$/],
  ["GET", /^bookings$/],
  ["POST", /^bookings$/],
  ["GET", /^bookings\/[^/]+$/],
  ["DELETE", /^bookings\/[^/]+$/],
];

const FORWARDED_RESPONSE_HEADERS = ["retry-after", "idempotent-replayed", "x-request-id"];
const UPSTREAM_TIMEOUT_MS = 60_000; // generous: free-tier hosts can take ~30s to wake up

async function proxy(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  const target = path.map(encodeURIComponent).join("/");

  if (!ALLOWED_ROUTES.some(([method, pattern]) => method === req.method && pattern.test(target))) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const { BACKEND_URL, API_KEY } = process.env;
  if (!BACKEND_URL || !API_KEY) {
    console.error("BACKEND_URL and API_KEY must be set on the server");
    return Response.json({ error: "service is not configured" }, { status: 500 });
  }

  const headers = new Headers({ "X-API-Key": API_KEY, "Content-Type": "application/json" });
  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  const base = BACKEND_URL.replace(/\/$/, "");
  const call = (path: string, init: RequestInit = {}) =>
    fetch(`${base}/${path}`, { headers, cache: "no-store", signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS), ...init });

  try {
    let upstream: Response;
    if (target === "slots") {
      upstream = await call(`slots${req.nextUrl.search}`);
    } else {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session) return Response.json({ error: "please sign in to continue" }, { status: 401 });
      const { name, email } = session.user;

      if (req.method === "POST") {
        const body: unknown = await req.json().catch(() => null);
        const slotId = body && typeof body === "object" && "slot_id" in body ? body.slot_id : undefined;
        upstream = await call("bookings", { method: "POST", body: JSON.stringify({ slot_id: slotId, name, email }) });
      } else if (target === "bookings") {
        const params = new URLSearchParams(req.nextUrl.search);
        params.set("email", email);
        upstream = await call(`bookings?${params}`);
      } else {
        // Single booking: only its owner may read or cancel it. Others get the same 404 as a missing id.
        const existing = await call(target);
        if (!existing.ok) {
          upstream = existing;
        } else {
          const booking = (await existing.json()) as { email?: string };
          if (booking.email?.toLowerCase() !== email.toLowerCase()) {
            return Response.json({ error: "booking not found" }, { status: 404 });
          }
          upstream = req.method === "DELETE" ? await call(target, { method: "DELETE" }) : Response.json(booking);
        }
      }
    }

    const responseHeaders = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (err) {
    console.error("booking API unreachable", err);
    return Response.json({ error: "the booking service is unavailable, please try again" }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as DELETE };
