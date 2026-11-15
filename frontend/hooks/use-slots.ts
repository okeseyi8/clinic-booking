"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useSlots() {
  return useQuery({
    queryKey: queryKeys.slots,
    queryFn: api.listSlots,
    refetchInterval: 30_000, // availability changes as other patients book
  });
}
