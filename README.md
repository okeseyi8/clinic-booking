# Clinic Booking

A clinic booking API plus a small web app on top of it. Patients see open slots, book one, get a confirmation, look up their bookings and cancel them.

| | Stack |
|---|---|
| `backend/` | Node 22, Express 5, TypeScript, Joi, MongoDB and Mongoose |
| `frontend/` | Next.js 16 (App Router), TypeScript, TanStack Query, zod, shadcn/ui, sonner |

The API follows the contract in [`koya-docs.json`](koya-docs.json) exactly. Every error comes back as `{"error": "<message>"}`.

---

## How each level is solved

### Level 1: list, book, look up
- `GET /slots` returns the slots sorted by `start`. Availability comes from one extra query (`distinct` over confirmed bookings), so the endpoint makes **2 queries total, with no N+1**.
- `POST /reset` replaces the slots and clears bookings and their derived state, which is idempotency records and rate-limit counters.
- Booking ids are ObjectIds. A malformed id returns 404 instead of a 500.

### Level 2: API key and validation
- [`requireApiKey`](backend/src/middleware/api-key.ts) protects every spec route. It compares hashes with `timingSafeEqual`, so response timing reveals nothing about the key.
- A Joi schema ([`booking.schema.ts`](backend/src/modules/bookings/booking.schema.ts)) trims `name`/`email`, lowercases the email and rejects anything missing, blank or invalid with 400.
- The service then applies the business rules in order: unknown slot → 404, slot already started → 400.
- Hardening: helmet, a CORS allowlist, a 10 kb body limit, structured pino logs with request ids, and env validation that fails fast at boot.

### Level 3: no double booking, even at the same instant
The database enforces it, not application code:

```ts
// booking.model.ts
bookingSchema.index({ slotId: 1 }, { unique: true, partialFilterExpression: { status: 'confirmed' } });
```

- At most one *confirmed* booking can exist per slot. The service just inserts: one concurrent request wins and the rest get duplicate-key errors, which become **409**. There is no "check, then insert" race, and it holds across any number of API instances.
- Cancelling is one atomic conditional update (`confirmed → cancelled`). A cancelled row drops out of the partial index, so the slot is free immediately.
- Indexes are created **before** the server accepts traffic ([`db.ts`](backend/src/config/db.ts)), because correctness depends on them.

### Level 4: idempotent retries and pagination
**Idempotency.** [`idempotency.ts`](backend/src/middleware/idempotency.ts) stores one document per `Idempotency-Key`, using the key as `_id`.
1. The first request claims the key with an atomic insert, runs, and **stores its response before sending it**.
2. A retry with the same body gets the stored status and body replayed: the same booking `id`, and no new booking.
3. A retry with a different body gets **422**.
4. A retry that arrives while the first request is still running waits briefly, then replays its result.
5. 429 and 5xx responses are not stored; the key is released so a genuine retry can still succeed.
6. A crashed request's lock goes stale after 30s and can be taken over. Records expire after 24h through a TTL index.

**Pagination.** Keyset (cursor) pagination over `(createdAt, _id)` uses the index `{email, createdAt, _id}`.
- The cursor is an opaque base64url value for the last row on the page.
- The query fetches `limit + 1` rows to know whether a next page exists, with no count query.
- It stays fast at any depth, unlike `skip`, and never skips or repeats rows when new bookings arrive between pages.

### Level 5: anti-spam
[`rate-limit.ts`](backend/src/middleware/rate-limit.ts) is a **sliding-window log in MongoDB**, shared by every instance and surviving restarts.
- Each attempt runs **one atomic update pipeline**: drop timestamps older than 60s, and record this attempt if fewer than 5 remain.
- The 6th attempt within any 60s span returns **429** with `Retry-After`, the whole seconds until the oldest attempt ages out.
- Failed attempts (400/404/409) count. Rejected attempts are not recorded, so a spammer can't extend their own lockout forever.
- Middleware order is `idempotency → rate limit → handler`, so a client's safe retries never use up their budget.

### Frontend
- **The API key never reaches the browser.** The browser calls `/api/*` on the Next.js server, and [`app/api/[...path]/route.ts`](frontend/app/api/[...path]/route.ts) attaches the key server-side. It only forwards an **allowlist** of routes, so `POST /reset` is not reachable from the public site.
- Every response is parsed with zod at the network boundary ([`lib/schemas.ts`](frontend/lib/schemas.ts)).
- [`useIdempotencyKey`](frontend/hooks/use-idempotency-key.ts) gives each distinct submission one key. That makes double-clicks and TanStack's automatic network-error retries safe, because the server replays the first result.
- Errors become toasts the patient can act on: 409 "someone just booked this slot", 429 "wait N seconds".

---

## Project layout

```
backend/src/
  app.ts                  Express wiring (no side effects, imported by tests)
  server.ts               connect DB → ensure indexes → listen → graceful shutdown
  config/                 env validation, DB connection
  lib/                    HttpError, cursor, validation, hashing, Mongo helpers
  middleware/             api-key, idempotency, rate-limit, error-handler
  models/                 idempotency-key, rate-limit
  modules/<feature>/      model · schema · service · controller · routes
backend/test/api.test.ts  end-to-end tests against a real (in-memory) MongoDB

frontend/
  app/                    pages + the server-side API proxy
  components/             slot browser, booking dialog, booking details, my bookings
  hooks/                  TanStack Query hooks (queries + mutations)
  lib/                    typed API client, zod schemas, query keys, formatting
```

Requests flow **route → middleware → controller (HTTP only) → service (business rules) → model**. Controllers never contain rules, and services never touch `req`/`res`.

---

## Run locally

```bash
# API (needs a MongoDB URI: local, Docker or Atlas)
cd backend
cp .env.example .env            # set MONGODB_URI and API_KEY
npm install
npm run dev                     # http://localhost:4000

# Web
cd frontend
cp .env.example .env.local      # BACKEND_URL=http://localhost:4000 and the same API_KEY
npm install
npm run dev                     # http://localhost:3000
```

Seed some slots:

```bash
curl -X POST localhost:4000/reset -H "X-API-Key: $API_KEY" -H 'Content-Type: application/json' \
  -d '{"slots":[{"id":"s1","provider":"Dr Ade","start":"2026-12-10T09:00:00Z","end":"2026-12-10T09:30:00Z"}]}'
```

## Tests

```bash
cd backend && npm test
```

The tests start an in-memory MongoDB and cover every level:
- 401s and all the 400/404 cases
- **20 simultaneous bookings for one slot give exactly one 201**
- cancel and re-book
- idempotent replay, the 422 mismatch, and concurrent retries with the same key
- walking 23 bookings through cursor pages, where many share a timestamp
- the 6th attempt returning 429 with `Retry-After`, and 10 simultaneous attempts letting exactly 5 through

## Known limits / next steps
- Rate limiting is per email, as the spec defines it. Add a per-IP limit at the edge (WAF or CDN) for abuse spread across many emails.
- `GET /slots` is unpaginated, per the spec. Add a date range or cursor once a clinic has thousands of future slots.
- `POST /reset` isn't transactional because it's an admin/test operation.
