"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { describeError } from "@/lib/api/errors";
import { QUERY_DEFAULTS, invalidatingMutationCache } from "@/lib/query/client";

let browserQueryClient: QueryClient | undefined;

function makeBrowserQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: QUERY_DEFAULTS,
    mutationCache: invalidatingMutationCache(),
    queryCache: new QueryCache({
      // A first load that fails reaches the error boundary. A background refetch that
      // fails keeps the data on screen; one toast per query, so a failing poll replaces
      // its toast instead of stacking a new one every minute.
      onError: (error, query) => {
        if (query.state.data !== undefined) {
          toast.error(describeError(error), { id: query.queryHash });
        }
      },
    }),
  });
}

// A server render must not share a cache between requests; the browser keeps one.
function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return makeBrowserQueryClient();
  browserQueryClient ??= makeBrowserQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
