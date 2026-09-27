import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { PageHeader } from "@/components/shell/PageHeader";
import { getDashboard } from "@/lib/api/dashboard";
import { dashboardQuery } from "@/lib/dashboard/queries";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const queryClient = getServerQueryClient();
  await queryClient.fetchQuery({ ...dashboardQuery, queryFn: () => getDashboard() });

  return (
    <>
      <PageHeader crumbs={[{ label: "Dashboard" }]} title="Dashboard" />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardView />
      </HydrationBoundary>
    </>
  );
}
