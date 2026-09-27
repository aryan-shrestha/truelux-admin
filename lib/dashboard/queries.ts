import { queryOptions } from "@tanstack/react-query";

import type { Dashboard } from "@/lib/api/types";
import { POLL_INTERVAL_MS } from "@/lib/query/client";
import { getJson } from "@/lib/query/fetch-json";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export const dashboardQuery = queryOptions({
  queryKey: dashboardKeys.all,
  queryFn: ({ signal }) => getJson<Dashboard>("/api/dashboard", undefined, signal),
  refetchInterval: POLL_INTERVAL_MS,
});
