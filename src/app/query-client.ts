import { MutationCache, QueryCache, QueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

import { FRESHNESS } from "@/lib/freshness";
import { ApiError, describeError } from "@/lib/repositories/errors";

const MAX_RETRIES = 2;

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
    mutationMeta: { invalidates?: readonly QueryKey[] };
  }
}

function shouldRetry(failureCount: number, error: ApiError): boolean {
  // A 4xx will fail the same way again; only network failures and 5xx are retried.
  const isClientError = error.status >= 400 && error.status < 500;
  return !isClientError && failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // A query that names no freshness class errs towards fresh.
      queries: { ...FRESHNESS.volatile, retry: shouldRetry },
    },
    queryCache: new QueryCache({
      // A first load that fails reaches the route error page. A background refetch that
      // fails keeps its data on screen; one toast per query, so a failing poll replaces
      // its toast instead of stacking a new one every minute.
      onError: (error, query) => {
        if (query.state.data !== undefined) {
          toast.error(describeError(error), { id: query.queryHash });
        }
      },
    }),
    mutationCache: new MutationCache({
      // A mutation lists the queries it leaves stale. Waiting for the active ones to
      // refetch keeps the mutation pending until the screen shows its result.
      onSuccess: (_data, _variables, _context, mutation, { client }) =>
        Promise.all(
          (mutation.meta?.invalidates ?? []).map((queryKey) =>
            client.invalidateQueries({ queryKey }),
          ),
        ),
    }),
  });
}
