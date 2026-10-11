import type { QueryClient } from "@tanstack/react-query";
import { createRouter, type RouterHistory } from "@tanstack/react-router";

import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { routeTree } from "@/routeTree.gen";

export interface RouterContext {
  queryClient: QueryClient;
}

export function createAppRouter({
  queryClient,
  history,
}: {
  queryClient: QueryClient;
  history?: RouterHistory;
}) {
  return createRouter({
    routeTree,
    history,
    context: { queryClient },
    defaultPreload: "intent",
    // TanStack Query owns freshness, so the router must not cache loader results itself.
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PageSkeleton,
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
