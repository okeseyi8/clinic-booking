# Clinic Booking API + Web App — Plan

## Context
This is the Koya assessment task: build a clinic booking API that follows `koya-docs.json` (OpenAPI 3.0.3) exactly, plus a Next.js page that uses it, and deploy both over HTTPS. The automated checks call the API directly, so status codes, the error shape `{"error": "..."}` and field names (`slot_id`, `created_at`, `next_cursor`) must match the spec. The goal is code a senior reviewer accepts as standard: correctness lives in the database, the layers are thin and explainable, and there's no cleverness.

The repo is new. It contains only `koya-docs.json` and an empty `rr.js`, which stays untouched.

Stack: **backend** Node 20, Express 5, TypeScript, Joi, Mongoose/MongoDB Atlas. **Frontend** Next.js (App Router), TypeScript, zod, TanStack Query, shadcn/ui, sonner. **Deploy:** API on Render, web on Vercel, database on Atlas M0. I drive the CLIs and the user supplies credentials step by step.

## Layout
```
backend/
  src/
    app.ts                 # express wiring (exported for tests)
    server.ts              # connect DB → ensure indexes → listen → graceful shutdown
    config/env.ts          # Joi-validated env, fail fast (PORT, MONGODB_URI, API_KEY, CORS_ORIGIN)
    config/db.ts
    lib/http-error.ts      # HttpError(status, message)
    lib/cursor.ts          # base64url encode/decode {c: createdAt, i: id}
    lib/stable-hash.ts     # sha256 of key-sorted JSON (idempotency fingerprint)
    middleware/api-key.ts  # X-API-Key, timingSafeEqual → 401
    middleware/validate.ts # validate(schema, 'body'|'query') → 400 with first Joi message
    middleware/idempotency.ts
    middleware/rate-limit.ts
    middleware/error-handler.ts  # notFound(404), bad JSON(400), 413, Mongo dup, 500 — always {error}
    modules/slots/    slot.model.ts  slot.schema.ts  slot.service.ts  slot.controller.ts  slot.routes.ts
    modules/bookings/ booking.model.ts booking.schema.ts booking.service.ts booking.controller.ts booking.routes.ts booking.dto.ts
    modules/reset/    reset.service.ts reset.routes.ts
    models/idempotency-key.model.ts, models/rate-limit.model.ts
  test/api.test.ts         # node:test + supertest + mongodb-memory-server
  render.yaml (at repo root)
frontend/
  app/layout.tsx, providers.tsx (QueryClient + <Toaster/>)
  app/page.tsx                    # slots + provider filter + book dialog
  app/bookings/[id]/page.tsx      # confirmation / booking detail + cancel
  app/bookings/page.tsx           # "My bookings": email lookup, infinite cursor list, cancel
  app/api/[...path]/route.ts      # server-side proxy (holds API key)
  lib/api.ts, lib/schemas.ts      # typed fetch client, ApiError, zod response/form schemas
  hooks/use-slots.ts, use-book-slot.ts, use-bookings.ts, use-cancel-booking.ts
  components/slot-card.tsx, booking-dialog.tsx, booking-status-badge.tsx, ui/* (shadcn)
```
Each module follows the same flow: route → middleware → controller (HTTP only) → service (business rules) → model. DTO mappers turn camelCase Mongo docs into the snake_case spec shape.

## Backend design, by level

**Level 1**
- `Slot { _id: string (client id like "s1"), provider, start: Date, end: Date }`. Index `{start:1}` and `{provider:1, start:1}`.
- `GET /slots?provider=` sorts by `start` asc. Availability comes from one extra query, `Booking.distinct('slotId', {status:'confirmed', slotId:{$in}})`, put into a Set. That's two queries total, with no N+1.
- `POST /reset` validates the slots array (unique ids, ISO dates, end > start) and replaces all slots. It also deletes bookings, idempotency keys and rate-limit counters so check runs start clean. It returns 200 `{ok:true}`.
- `GET /bookings/:id` uses ObjectId ids. A malformed id returns 404, not 500.

**Level 2**
- An API-key middleware runs on every spec route and uses a constant-time compare. `/health` stays unauthenticated for the Render health check, since it's outside the spec.
- The Joi `NewBooking` schema: `slot_id` must be a non-empty string; `name` is trimmed and non-empty; `email` is trimmed, lowercased and checked with `.email()`. Unknown fields are stripped.
- The service checks in this order: slot exists (404), then `slot.start <= now` (400 "slot has already started"), then insert.
- Hardening: helmet, a CORS allowlist, `express.json({limit:'10kb'})`, `trust proxy` for Render, and pino-http logs with a request id.

**Level 3: double booking is impossible, enforced by the database**
- A **partial unique index** `bookings {slotId:1} unique, partialFilterExpression {status:'confirmed'}`.
- The insert either wins or throws E11000, which maps to 409 "slot already booked". There's no read-then-write race, and it holds across any number of API instances.
- Cancelling sets status to `cancelled`. That drops the row out of the partial index and frees the slot.
- `DELETE /bookings/:id` uses an atomic `findOneAndUpdate({_id, status:'confirmed'}, {status:'cancelled'})`. If nothing matches, an existing booking means 409 "already cancelled"; otherwise 404.
- `server.ts` awaits `syncIndexes()` before listening, because correctness depends on this index existing in production.

**Level 4: idempotency and pagination**
- The `IdempotencyKey { _id: key, requestHash, state: 'in_progress'|'completed', statusCode, body, lockedAt, expiresAt (TTL 24h) }` record. The middleware runs on `POST /bookings` only, and only when the header is present.
  1. It claims the key with `insertOne` (`_id` is unique, so the claim is atomic).
  2. If the key already exists and the hash differs, it returns 422. If the record is completed, it replays the stored status and body. If the record is still in progress, it polls briefly (about 5s) and then replays. If the lock is stale (more than 30s old, from a crashed worker), it deletes it and claims the key again.
  3. It wraps `res.json` to save the final response. It stores 2xx and 4xx responses. For 429 and 5xx it releases the key so a real retry can go through (the same rule Stripe uses).
- The partial unique index is a second safety net: even if idempotency were bypassed, the same slot can't be booked twice.
- `GET /bookings?email&limit&cursor`: `limit` is an integer from 1 to 50 (default 10), and anything else returns 400. The email is normalized to lower case, so matching ignores case.
  - It sorts by `{createdAt:1, _id:1}` with index `{email:1, createdAt:1, _id:1}`. It uses keyset pagination: `$or [{createdAt > c}, {createdAt = c, _id > i}]`.
  - It fetches `limit + 1` rows to compute `next_cursor`, which is null on the last page. A tampered cursor returns 400.

**Level 5: rate limiting**
- A Mongo-backed **sliding-window log**, so it's shared across instances and survives restarts. Each email gets one doc `{_id: email, hits: Date[], expiresAt}` with a TTL.
- A single atomic `findOneAndUpdate` with an update pipeline, run as an upsert:
  1. Drop hits older than 60s.
  2. If fewer than 5 remain, push `now`.
  3. Return the doc.
- If the push didn't happen, it returns 429 with `Retry-After = ceil((oldestHit + 60s − now)/1000)`, at least 1. The array never holds more than 5 entries.
- Order in the chain: `apiKey → idempotency → rateLimit → validate → controller`.
  - Idempotent replays and 422s don't use up the budget, so legitimate retries aren't punished.
  - Every new attempt counts, including 400, 404 and 409.
  - The key is the trimmed, lowercased `email` when it's a non-empty string. If there's no email, validation rejects the request anyway.
- `// ponytail:` note: a per-IP limiter at the edge (Render or Cloudflare) is the next step for abuse that isn't tied to one email.

## Frontend design
- **The API key never reaches the browser.** `app/api/[...path]/route.ts` forwards to `BACKEND_URL` and adds `X-API-Key` from a server env var. It passes through `Idempotency-Key` and the response status and headers, including `Retry-After`. It uses an **allowlist** of `GET /slots`, `GET|POST /bookings` and `GET|DELETE /bookings/:id`, so `/reset` is never exposed to the public.
- `lib/api.ts` is a typed fetch client. It throws `ApiError(status, message, retryAfter)` and parses every response with zod, since responses cross a trust boundary.
- Booking flow:
  1. A slot card opens a dialog with a zod-validated form (name, email).
  2. On submit, the client generates an idempotency key once with `crypto.randomUUID()` and keeps it with that submission. TanStack's retry on network errors reuses the same key, which shows the Level 4 guarantee end to end.
  3. On success the app invalidates the slots query and routes to `/bookings/[id]` for the confirmation.
- Errors become sonner toasts: 409 says "Someone just booked this slot" and refetches slots; 429 says "Too many attempts, try again in Ns"; 400 shows the server's message.
- "My bookings" uses `useInfiniteQuery` with `next_cursor` and a "Load more" button. Cancel uses a confirm dialog, then invalidates the bookings and slots queries.
- shadcn components: button, card, input, label, badge, dialog, select, skeleton, sonner. There are loading skeletons, empty states, accessible labels, and booked slots are disabled.

## Tests (backend, `npm test`)
These use node:test, supertest and mongodb-memory-server against the real Express app:
- 401 without a key or with a wrong key.
- Every 400 case: missing, empty, whitespace-only or bad email; a started slot; also 404.
- 20 parallel POSTs for one slot give exactly one 201 and nineteen 409s. Cancelling then lets the slot be booked again.
- Idempotency: replay returns the same id and status; a different body returns 422; parallel requests with the same key create one booking.
- Pagination: walk 23 bookings at limit 10 and get 10/10/3 with `next_cursor` null at the end. `limit=0` or `51` returns 400. Email matching ignores case.
- Rate limit: the 6th attempt returns 429 with an integer `Retry-After`, and another email is unaffected.

## Deployment, step by step (the user provides, I run)
1. **Atlas:** the user creates a free M0 cluster and a database user, allows network access from `0.0.0.0/0` (Render free tier has no static IP), and pastes the `mongodb+srv://` URI to me.
2. **GitHub:** the user creates an empty repo or runs `gh auth login`. I commit and push, which Render needs.
3. **Render:** the user creates an account and an API key, or I use the `render.yaml` Blueprint. I set `MONGODB_URI`, `API_KEY` (I generate a strong random key) and `CORS_ORIGIN`, deploy, and check `/health` plus a curl smoke test over HTTPS.
4. **Vercel:** the user runs `vercel login`. I run `vercel --prod` from `frontend/` and set `BACKEND_URL` and `API_KEY` as server-only env vars.
5. I report back both HTTPS URLs and the API key to submit. One caveat: the Render free tier sleeps when idle, so the first request takes about 30s.

## Verification
- `cd backend && npm test` passes all the cases above, and `npm run build` type-checks.
- Run locally: backend on :4000 against a local or memory Mongo, frontend on :3000. In the browser, list slots, book, see the confirmation, look up bookings by email, page through them, and cancel.
- After deploying, curl the live API: 401 without a key, `POST /reset` with sample slots, book, 20 concurrent bookings (one 201), an idempotent replay, the rate-limit 429, and pagination.
