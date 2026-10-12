import { createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardSkeleton, dashboardQueries, DashboardView } from "@/features/dashboard";

export const Route = createFileRoute("/_dashboard/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQueries.dashboard()),
  pendingComponent: DashboardSkeleton,
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <Page isScrollable>
      <PageHeader crumbs={[{ label: "Dashboard" }]} title="Dashboard" />
      <DashboardView />
    </Page>
  );
}
