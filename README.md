# HowBody

HowBody is a booking system for a family clinic. Patients browse open appointment times, filter them by day, time of day and doctor, then book, view and cancel visits from their own account.

- **Website:** https://howbody.vercel.app
- **Booking API:** https://clinic-booking-api-pi.vercel.app (every route needs an `X-API-Key` header)

The repo has two apps:

| Folder | What it is |
|---|---|
| `backend/` | The booking API. It follows the contract in [`koya-docs.json`](koya-docs.json) exactly. |
| `frontend/` | The HowBody website: landing page, live booking, accounts and "My bookings". |

---

## How it works

```
Browser ──▶ Next.js server (frontend) ──▶ Booking API (backend) ──▶ MongoDB Atlas
              │  holds the API key           │  slots, bookings,
              │  checks the user's session   │  idempotency, rate limits
              └─▶ Better Auth ──▶ MongoDB (accounts)
```

1. The browser never talks to the booking API directly. It calls `/api/*` on the website's own server.
2. That server checks who is signed in, attaches the secret API key, and forwards only the routes the site needs. Admin routes such as `POST /reset` can't be reached from the public site.
3. The booking API validates the request, applies the business rules, and lets the database guarantee correctness: no double booking, safe retries and rate limits.

### Who can do what

| Action | Signed out | Signed in |
|---|---|---|
| Browse and filter open times | ✅ | ✅ |
| Book a time | Prompted to log in or sign up | ✅ One click: name and email come from the account |
| See and cancel bookings | ❌ | ✅ Only their own |

---

## Using the website

1. Open https://howbody.vercel.app. The open times are right under the hero.
2. Search ("Bello", "Friday", "10:30") or filter by day, morning/afternoon/evening, and doctor.
3. Pick a time. If you're signed out, a modal lets you log in, create an account, or reset your password. After that, the booking confirmation opens straight away.
4. Confirm. You land on the booking's page, and it appears under **My bookings**, where you can cancel it.

## Using the API

```bash
API=https://clinic-booking-api-pi.vercel.app
KEY=<your api key>

curl $API/slots -H "X-API-Key: $KEY"

curl -X POST $API/bookings -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"slot_id":"s1","name":"Ada Obi","email":"ada@example.com"}'

curl "$API/bookings?email=ada@example.com&limit=10" -H "X-API-Key: $KEY"
curl -X DELETE $API/bookings/<id> -H "X-API-Key: $KEY"
```

The full contract is in [`koya-docs.json`](koya-docs.json). Errors are always `{"error": "<message>"}`.

---

## Tech stack

| Layer | Choice |
|---|---|
| API | Node 22, Express 5, TypeScript, Joi, Mongoose, pino |
| Database | MongoDB Atlas |
| Website | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| Data and forms | TanStack Query, zod |
| UI | Tailwind CSS 4, shadcn/ui (Radix), sonner toasts, lucide icons |
| Accounts | Better Auth (email + password, Google, password reset), MongoDB adapter |
| Email | Brevo free tier over plain `fetch` |
| Hosting | Vercel (both apps, serverless) |
| Tests | `node:test`, supertest, mongodb-memory-server |

---

## Technical approaches

### Correctness lives in the database
- **No double booking.** A partial unique index allows at most one *confirmed* booking per slot:
  ```ts
  bookingSchema.index({ slotId: 1 }, { unique: true, partialFilterExpression: { status: 'confirmed' } });
  ```
  The service just inserts. If 20 people book the same slot at the same instant, one gets 201 and nineteen get 409. There's no "check, then insert" race, and it holds across any number of servers.
- **Cancelling** is one atomic conditional update (`confirmed → cancelled`). The cancelled row leaves the index, so the slot frees up immediately.

### Safe retries (idempotency)
`POST /bookings` accepts an `Idempotency-Key`. The key is stored as the document `_id`, so claiming it is atomic.
- A retry with the same body replays the original response: the same booking, nothing new created.
- A retry with a different body returns 422.
- The website creates one key per submission and reuses it on automatic retries, so double-clicks and flaky networks never create two bookings.

### Pagination
`GET /bookings` uses keyset (cursor) pagination over `(createdAt, _id)` with a matching index.
- The cursor is opaque base64url.
- It fetches `limit + 1` rows, so there's no count query.
- It stays fast at any depth and never repeats or skips rows when new bookings arrive.

### Rate limiting
A sliding window stored in MongoDB allows 5 booking attempts per email per 60 seconds. Each attempt is one atomic update pipeline. The 6th returns 429 with `Retry-After`. Because it lives in the database, every server instance shares the same count.

### Accounts and authorization
Better Auth runs inside the Next.js app and keeps accounts in their own database (`howbody_auth`).
- The rule "only signed-in users can book" is enforced **on the server**, in the website's proxy, not in the browser.
- The proxy replaces any `name`/`email` in the request with the signed-in account's.
- It scopes list, read and cancel to the user's own email, so nobody can book as, or look at, someone else.
- The booking API itself stays exactly as specified.

### Layering
API requests flow **route → middleware → controller → service → model**.
- Controllers only speak HTTP; services hold the business rules; models own the data.
- Responses are mapped from Mongo's camelCase to the spec's snake_case in one place.
- On the website, every API response is parsed with zod before the UI touches it.

---

## Designed for failure

| What can go wrong | How it's handled |
|---|---|
| Two people book the same slot at once | The unique index lets exactly one win. The other gets a clear 409 ("someone just booked this slot") and the list refreshes. |
| The network drops after a booking was made | The retry carries the same idempotency key, so the server replays the first result instead of booking twice. |
| A retry arrives while the first request is still running | It waits briefly and replays the result. A crashed request's lock goes stale after 30s and is taken over. |
| The server errors (5xx) or rate-limits (429) | The idempotency key is released, so a genuine retry can still succeed. |
| Someone spams bookings | The per-email limit returns 429 with `Retry-After`, and the website shows "wait N seconds". |
| Bad or malicious input | Joi on the API and zod on the website reject it with a 400 and a specific message. Body size is capped at 10 kb. Unknown fields are stripped. A malformed id returns 404, not 500. |
| A missing or misconfigured setting | Environment variables are validated at startup, and the app refuses to boot rather than half-work. |
| The database is slow or unreachable | Connections time out after 10s. A failed serverless cold start isn't cached, so the next request retries. The website shows a retry option instead of a blank page. |
| The API is slow to wake up | The website's proxy allows up to 60s and returns a friendly 502 if the API is down. |
| Deploys and scale-down | On `SIGTERM` the API stops taking new requests, finishes in-flight ones, then closes the DB connection. |
| Indexes missing on a fresh database | Indexes are created before the API accepts traffic, because correctness depends on them. |
| A leaked or guessed API key | The key lives only on servers, is compared in constant time, and the public site can't reach admin routes. |
| Account abuse | Better Auth rate-limits auth routes (shared in the database). Password resets don't reveal whether an email has an account. Resetting a password signs out other devices. |
| Email provider is down | Reset emails are sent in the background, so the page never hangs. The failure is logged. |

---

## Run locally

```bash
# 1. API (needs a MongoDB URI: local, Docker or Atlas)
cd backend
cp .env.example .env            # set MONGODB_URI and API_KEY
npm install
npm run dev                     # http://localhost:4000

# 2. Website
cd frontend
cp .env.example .env.local      # BACKEND_URL, the same API_KEY, plus the auth settings
npm install
npm run dev                     # http://localhost:3000
```

Seed some slots:

```bash
curl -X POST localhost:4000/reset -H "X-API-Key: $API_KEY" -H 'Content-Type: application/json' \
  -d '{"slots":[{"id":"s1","provider":"Dr Ade","start":"2026-12-10T09:00:00Z","end":"2026-12-10T09:30:00Z"}]}'
```

Website settings (`frontend/.env.local`):

| Variable | Purpose |
|---|---|
| `BACKEND_URL` / `API_KEY` | Where the booking API is, and its key (server-only) |
| `MONGODB_URI` | Database for accounts |
| `BETTER_AUTH_SECRET` | Random secret for signing sessions (`openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | The site's public URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google sign-in. Redirect URI: `<site>/api/auth/callback/google` |
| `BREVO_API_KEY` / `MAIL_FROM` | Optional reset emails. Without them, dev prints the email to the console. |
| `MONGODB_TRANSACTIONS` | `false` only for a standalone local mongod |

## Tests

```bash
cd backend && npm test
```

The tests run against an in-memory MongoDB and cover:
- missing keys and every 400/404 case;
- **20 simultaneous bookings for one slot giving exactly one 201**;
- cancel and re-book;
- idempotent replay, the 422 mismatch, and concurrent retries with the same key;
- paging through 23 bookings that share timestamps;
- the 6th attempt returning 429 with `Retry-After`, and 10 simultaneous attempts letting exactly 5 through.

## Known limits

- Rate limiting is per email, as the spec defines. A per-IP limit at the edge would catch abuse spread across many emails.
- `GET /slots` isn't paginated, per the spec. Add a date range once a clinic has thousands of future slots.
- `POST /reset` is an admin/test operation and isn't transactional.
