"use client";

import { useCallback, useRef } from "react";

/**
 * One Idempotency-Key per distinct submission.
 *
 * Submitting the same payload again (a double-click, or an automatic retry after a
 * network blip) reuses the key, so the server replays the first result instead of
 * creating a second booking. Changing the payload gets a fresh key, because the
 * server rightly rejects a reused key with a different body (422).
 */
export function useIdempotencyKey() {
  const last = useRef<{ fingerprint: string; key: string } | null>(null);

  return useCallback((payload: unknown) => {
    const fingerprint = JSON.stringify(payload);
    if (last.current?.fingerprint !== fingerprint) {
      last.current = { fingerprint, key: crypto.randomUUID() };
    }
    return last.current.key;
  }, []);
}
