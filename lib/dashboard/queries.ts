import { queryOptions } from "@tanstack/react-query";

import type { Dashboard } from "@/lib/api/types";
import { FRESHNESS } from "@/lib/query/client";
import { getJson } from "@/lib/query/get-json";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export const dashboardQuery = queryOptions({
  queryKey: dashboardKeys.all,
  queryFn: ({ signal }) => getJson<Dashboard>("/api/dashboard", undefined, signal),
  ...FRESHNESS.live,
});
