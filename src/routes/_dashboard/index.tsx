import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";

export const Route = createFileRoute("/_dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <PageHeader
      title="Dashboard"
      description="Orders, revenue and stock arrive with the dashboard feature."
    />
  );
}
