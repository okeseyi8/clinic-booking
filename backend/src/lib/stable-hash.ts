import { createHash } from 'node:crypto';

/** JSON.stringify with object keys sorted, so `{a,b}` and `{b,a}` hash the same. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonicalize((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/** Fingerprint of a request body, used to detect an Idempotency-Key reused with a different body. */
export function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(value ?? null))).digest('hex');
}
