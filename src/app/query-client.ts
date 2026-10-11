import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/repositories/errors";

const MAX_RETRIES = 2;

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
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
      queries: { staleTime: 30_000, retry: shouldRetry },
    },
  });
}
