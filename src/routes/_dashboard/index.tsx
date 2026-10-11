import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { DashboardSkeleton, dashboardQueries, DashboardView } from "@/features/dashboard";

export const Route = createFileRoute("/_dashboard/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQueries.dashboard()),
  pendingComponent: DashboardSkeleton,
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={[{ label: "Dashboard" }]} title="Dashboard" />
      <DashboardView />
    </div>
  );
}
