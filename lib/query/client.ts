import { type DefaultOptions, MutationCache, type QueryKey } from "@tanstack/react-query";

import { ApiError, ApiUnreachableError } from "@/lib/api/errors";

// How often something outside the admin changes the data decides how soon it is
// refetched. The admin's own changes invalidate at once (lib/query/invalidation.ts).
export const FRESHNESS = {
  // New orders and other staff: stale after 30 s, polled every minute while shown.
  live: { staleTime: 30_000, refetchInterval: 60_000 },
  // Stock moves with storefront orders: stale after 30 s, refetched when shown again.
  volatile: { staleTime: 30_000 },
  // Changed only by other staff.
  reference: { staleTime: 10 * 60_000 },
} as const;

// The API answered with a code the admin branches on; asking again changes nothing.
// A transport failure or a 5xx may pass, so it gets one more try.
function isTransient(error: unknown): boolean {
  return error instanceof ApiUnreachableError || (error instanceof ApiError && error.status >= 500);
}

export const QUERY_DEFAULTS: DefaultOptions = {
  queries: {
    // A query that names no class errs towards fresh.
    ...FRESHNESS.volatile,
    // The cache doubles as the navigation cache for reused routes; sign-out and a
    // reload clear it.
    gcTime: Infinity,
    retry: (failureCount, error) => failureCount < 1 && isTransient(error),
  },
};

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: { invalidates?: readonly QueryKey[] };
  }
}

// A mutation lists the queries it makes stale. Invalidation waits for the active ones to
// refetch, so the mutation stays pending until the screen shows its result.
export function invalidatingMutationCache(): MutationCache {
  return new MutationCache({
    onSuccess: (_data, _variables, _result, mutation, { client }) =>
      Promise.all(
        (mutation.meta?.invalidates ?? []).map((queryKey) =>
          client.invalidateQueries({ queryKey }),
        ),
      ),
  });
}
