"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { describeError } from "@/lib/api/errors";
import { QUERY_DEFAULTS, invalidatingMutationCache } from "@/lib/query/client";

let browser: { userId: string; client: QueryClient } | undefined;

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

// A server render must not share a cache between requests. The browser keeps one per
// signed-in user: the cache lives for the whole tab session, and the client outlives the
// admin layout, so another sign-in in the same tab starts from an empty cache.
function getQueryClient(userId: string): QueryClient {
  if (typeof window === "undefined") return makeBrowserQueryClient();
  if (browser?.userId !== userId) {
    browser = { userId, client: makeBrowserQueryClient() };
  }
  return browser.client;
}

type QueryProviderProps = {
  userId: string;
  children: ReactNode;
};

export function QueryProvider({ userId, children }: QueryProviderProps) {
  return <QueryClientProvider client={getQueryClient(userId)}>{children}</QueryClientProvider>;
}
