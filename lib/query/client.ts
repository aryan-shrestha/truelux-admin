import { type DefaultOptions, MutationCache, type QueryKey } from "@tanstack/react-query";

import { ApiError, ApiUnreachableError } from "@/lib/api/errors";

export const STALE_TIME_MS = 30_000;
export const POLL_INTERVAL_MS = 60_000;

// The API answered with a code the admin branches on; asking again changes nothing.
// A transport failure or a 5xx may pass, so it gets one more try.
function isTransient(error: unknown): boolean {
  return error instanceof ApiUnreachableError || (error instanceof ApiError && error.status >= 500);
}

export const QUERY_DEFAULTS: DefaultOptions = {
  queries: {
    staleTime: STALE_TIME_MS,
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
