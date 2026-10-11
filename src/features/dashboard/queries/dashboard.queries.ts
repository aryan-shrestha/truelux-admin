import { queryOptions } from "@tanstack/react-query";

import { FRESHNESS } from "@/lib/freshness";

import { getDashboard } from "../repositories/dashboard.repository";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export const dashboardQueries = {
  dashboard: () =>
    queryOptions({ queryKey: dashboardKeys.all, queryFn: getDashboard, ...FRESHNESS.live }),
};
