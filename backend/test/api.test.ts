import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { pino } from 'pino';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { createApp } from '../src/app.js';
import { Booking } from '../src/modules/bookings/booking.model.js';

const API_KEY = 'test-key-0123456789abcdef';
const hour = 3_600_000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

let mongo: MongoMemoryServer;
let server: Server;
let api: ReturnType<typeof request.agent>;
let emailSeq = 0;
const freshEmail = () => `patient${++emailSeq}@example.com`;

const SLOTS = [
  { id: 's2', provider: 'Dr Bello', start: iso(2 * hour), end: iso(2.5 * hour) },
  { id: 's1', provider: 'Dr Ade', start: iso(1 * hour), end: iso(1.5 * hour) },
  { id: 's3', provider: 'Dr Ade', start: iso(3 * hour), end: iso(3.5 * hour) },
  { id: 'past', provider: 'Dr Ade', start: iso(-2 * hour), end: iso(-1.5 * hour) },
];

const book = (body: object, headers: Record<string, string> = {}) =>
  api.post('/bookings').set('X-API-Key', API_KEY).set(headers).send(body);
const get = (path: string) => api.get(path).set('X-API-Key', API_KEY);

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  server = createApp({ API_KEY, CORS_ORIGIN: [] }, pino({ level: 'silent' })).listen(0);
  api = request.agent(server);
});

after(async () => {
  server.close();
  await disconnectDb();
  await mongo.stop();
});

beforeEach(async () => {
  const res = await api.post('/reset').set('X-API-Key', API_KEY).send({ slots: SLOTS });
  assert.equal(res.status, 200);
});

describe('level 1 — slots and bookings', () => {
  test('lists slots earliest first with availability, and filters by provider', async () => {
    const res = await get('/slots');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.slots.map((s: { id: string }) => s.id), ['past', 's1', 's2', 's3']);
    assert.equal(res.body.slots[1].available, true);

    const filtered = await get('/slots?provider=Dr%20Bello');
    assert.deepEqual(filtered.body.slots.map((s: { id: string }) => s.id), ['s2']);
  });

  test('books a slot and looks it up', async () => {
    const created = await book({ slot_id: 's1', name: 'Ada Obi', email: 'ada@example.com' });
    assert.equal(created.status, 201);
    assert.equal(created.body.status, 'confirmed');
    assert.ok(created.body.id && created.body.created_at);

    const fetched = await get(`/bookings/${created.body.id}`);
    assert.equal(fetched.status, 200);
    assert.deepEqual(fetched.body, created.body);

    const slots = await get('/slots');
    assert.equal(slots.body.slots.find((s: { id: string }) => s.id === 's1').available, false);
  });

  test('unknown booking id returns 404 with an error body', async () => {
    for (const id of ['665f1f77bcf86cd799439011', 'not-an-id']) {
      const res = await get(`/bookings/${id}`);
      assert.equal(res.status, 404);
      assert.equal(typeof res.body.error, 'string');
    }
  });
});

describe('level 2 — auth and validation', () => {
  test('missing or wrong API key returns 401', async () => {
    assert.equal((await api.get('/slots')).status, 401);
    const wrong = await api.get('/slots').set('X-API-Key', 'nope');
    assert.equal(wrong.status, 401);
    assert.equal(typeof wrong.body.error, 'string');
  });

  test('rejects missing, blank or invalid fields with 400', async () => {
    const bad = [
      {},
      { name: 'Ada', email: 'a@example.com' },
      { slot_id: '', name: 'Ada', email: 'a@example.com' },
      { slot_id: 's1', name: '   ', email: 'a@example.com' },
      { slot_id: 's1', name: 'Ada' },
      { slot_id: 's1', name: 'Ada', email: '' },
      { slot_id: 's1', name: 'Ada', email: 'not-an-email' },
      { slot_id: 1, name: 'Ada', email: 'a@example.com' },
    ];
    for (const [i, body] of bad.entries()) {
      const res = await book(body);
      assert.equal(res.status, 400, `case ${i}: ${JSON.stringify(body)}`);
      assert.equal(typeof res.body.error, 'string');
    }
  });

  test('unknown slot → 404, started slot → 400', async () => {
    assert.equal((await book({ slot_id: 'nope', name: 'Ada', email: freshEmail() })).status, 404);
    assert.equal((await book({ slot_id: 'past', name: 'Ada', email: freshEmail() })).status, 400);
  });

  test('trims name/email and stores email lower-case', async () => {
    const res = await book({ slot_id: 's1', name: '  Ada Obi  ', email: '  ADA@Example.COM ' });
    assert.equal(res.status, 201);
    assert.equal(res.body.name, 'Ada Obi');
    assert.equal(res.body.email, 'ada@example.com');
  });

  test('malformed JSON returns 400 in the error shape', async () => {
    const res = await api
      .post('/bookings')
      .set('X-API-Key', API_KEY)
      .set('Content-Type', 'application/json')
      .send('{"slot_id":');
    assert.equal(res.status, 400);
    assert.equal(typeof res.body.error, 'string');
  });
});

describe('level 3 — no double booking, cancellation', () => {
  test('20 simultaneous requests for one slot: exactly one wins', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => book({ slot_id: 's1', name: `P${i}`, email: freshEmail() })),
    );
    const statuses = results.map((r) => r.status).sort();
    assert.equal(statuses.filter((s) => s === 201).length, 1);
    assert.equal(statuses.filter((s) => s === 409).length, 19);
    assert.equal(await Booking.countDocuments({ slotId: 's1', status: 'confirmed' }), 1);
  });

  test('cancel frees the slot; cancelling twice is 409; unknown is 404', async () => {
    const first = await book({ slot_id: 's1', name: 'Ada', email: freshEmail() });
    assert.equal((await book({ slot_id: 's1', name: 'Bo', email: freshEmail() })).status, 409);

    const cancelled = await api.delete(`/bookings/${first.body.id}`).set('X-API-Key', API_KEY);
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.status, 'cancelled');
    assert.equal((await get('/slots')).body.slots.find((s: { id: string }) => s.id === 's1').available, true);

    assert.equal((await api.delete(`/bookings/${first.body.id}`).set('X-API-Key', API_KEY)).status, 409);
    assert.equal((await api.delete('/bookings/665f1f77bcf86cd799439011').set('X-API-Key', API_KEY)).status, 404);
    assert.equal((await book({ slot_id: 's1', name: 'Bo', email: freshEmail() })).status, 201);
  });
});

describe('level 4 — idempotency and pagination', () => {
  test('same key + same body replays the same response without a second booking', async () => {
    const body = { slot_id: 's1', name: 'Ada', email: freshEmail() };
    const a = await book(body, { 'Idempotency-Key': 'k-1' });
    const b = await book(body, { 'Idempotency-Key': 'k-1' });
    assert.equal(a.status, 201);
    assert.equal(b.status, 201);
    assert.equal(b.body.id, a.body.id);
    assert.equal(await Booking.countDocuments({ slotId: 's1' }), 1);
  });

  test('same key + different body is 422', async () => {
    const email = freshEmail();
    await book({ slot_id: 's1', name: 'Ada', email }, { 'Idempotency-Key': 'k-2' });
    const res = await book({ slot_id: 's2', name: 'Ada', email }, { 'Idempotency-Key': 'k-2' });
    assert.equal(res.status, 422);
    assert.equal(typeof res.body.error, 'string');
  });

  test('concurrent retries with one key create one booking and get identical responses', async () => {
    const body = { slot_id: 's2', name: 'Ada', email: freshEmail() };
    const results = await Promise.all(Array.from({ length: 5 }, () => book(body, { 'Idempotency-Key': 'k-3' })));
    assert.deepEqual(new Set(results.map((r) => r.status)), new Set([201]));
    assert.equal(new Set(results.map((r) => r.body.id)).size, 1);
    assert.equal(await Booking.countDocuments({ slotId: 's2' }), 1);
  });

  test('error outcomes are replayed too (same status for the retry)', async () => {
    const body = { slot_id: 'nope', name: 'Ada', email: freshEmail() };
    assert.equal((await book(body, { 'Idempotency-Key': 'k-4' })).status, 404);
    assert.equal((await book(body, { 'Idempotency-Key': 'k-4' })).status, 404);
  });

  test('pages through a person’s bookings oldest first, case-insensitively', async () => {
    const email = 'pager@example.com';
    const sameInstant = new Date('2026-01-01T00:00:00Z');
    // 23 bookings, many sharing one createdAt, to prove the _id tie-breaker never skips/repeats rows.
    await Booking.insertMany(
      Array.from({ length: 23 }, (_, i) => ({
        slotId: `x${i}`,
        name: 'Pager',
        email,
        status: i % 2 ? 'cancelled' : 'confirmed',
        createdAt: i < 12 ? sameInstant : new Date(sameInstant.getTime() + i * 1000),
      })),
    );

    const seen: string[] = [];
    const sizes: number[] = [];
    let cursor: string | null = null;
    do {
      const qs: string = `email=PAGER@Example.com&limit=10${cursor ? `&cursor=${cursor}` : ''}`;
      const res = await get(`/bookings?${qs}`);
      assert.equal(res.status, 200);
      sizes.push(res.body.bookings.length);
      seen.push(...res.body.bookings.map((b: { id: string }) => b.id));
      cursor = res.body.next_cursor;
    } while (cursor);

    assert.deepEqual(sizes, [10, 10, 3]);
    assert.equal(new Set(seen).size, 23);
    const expected = (await Booking.find({ email }).sort({ createdAt: 1, _id: 1 })).map((b) => b.id);
    assert.deepEqual(seen, expected);
  });

  test('invalid limit or cursor returns 400; default limit is 10', async () => {
    for (const limit of ['0', '51', 'abc', '2.5']) {
      assert.equal((await get(`/bookings?email=a@example.com&limit=${limit}`)).status, 400, `limit=${limit}`);
    }
    assert.equal((await get('/bookings?email=a@example.com&cursor=garbage')).status, 400);
    assert.equal((await get('/bookings')).status, 400);

    const empty = await get('/bookings?email=nobody@example.com');
    assert.deepEqual(empty.body, { bookings: [], next_cursor: null });
  });
});

describe('level 5 — rate limiting', () => {
  test('6th attempt per email within a minute is 429 with Retry-After; other emails unaffected', async () => {
    const email = freshEmail();
    for (let i = 0; i < 5; i++) {
      // failed attempts count too: these all 404
      assert.equal((await book({ slot_id: 'nope', name: 'Spam', email })).status, 404);
    }
    const blocked = await book({ slot_id: 's1', name: 'Spam', email: email.toUpperCase() });
    assert.equal(blocked.status, 429);
    assert.equal(typeof blocked.body.error, 'string');
    const retryAfter = Number(blocked.headers['retry-after']);
    assert.ok(Number.isInteger(retryAfter) && retryAfter >= 1 && retryAfter <= 60, `Retry-After=${retryAfter}`);

    assert.equal((await book({ slot_id: 's1', name: 'Fine', email: freshEmail() })).status, 201);
  });

  test('limit holds under concurrency: 10 simultaneous attempts → exactly 5 get through', async () => {
    const email = freshEmail();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => book({ slot_id: 'nope', name: 'Burst', email })),
    );
    assert.equal(results.filter((r) => r.status === 429).length, 5);
  });

  test('idempotent replays do not consume the budget', async () => {
    const body = { slot_id: 's3', name: 'Ada', email: freshEmail() };
    for (let i = 0; i < 8; i++) {
      assert.equal((await book(body, { 'Idempotency-Key': 'k-5' })).status, 201);
    }
  });
});
