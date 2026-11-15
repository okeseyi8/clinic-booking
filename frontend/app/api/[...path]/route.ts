import type { NextRequest } from "next/server";

/**
 * Backend-for-frontend proxy.
 *
 * The booking API requires a secret X-API-Key. Shipping that key to the browser
 * would make it public, so the browser calls /api/* on this Next.js server and
 * we attach the key here, server-side.
 *
 * Only the routes the UI needs are allowed through. Admin routes such as
 * POST /reset are never reachable from the public site.
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

  try {
    const upstream = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/${target}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: req.method === "POST" ? await req.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

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
