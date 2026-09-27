import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

import { invalidatingMutationCache } from "@/lib/query/client";

export function testQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: invalidatingMutationCache(),
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export function renderWithQuery(ui: ReactElement, client: QueryClient = testQueryClient()) {
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) };
}
