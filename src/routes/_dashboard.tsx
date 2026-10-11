import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authQueries, UserMenu } from "@/features/auth";
import { hasSession } from "@/lib/repositories/session";
import { useUiStore } from "@/stores/ui.store";

export const Route = createFileRoute("/_dashboard")({
  // Navigation only: the API authorizes every call. A stored session that has died is
  // sent back to sign-in by the HTTP client when `me` fails to refresh.
  beforeLoad: async ({ context, location }) => {
    if (!hasSession()) {
      throw redirect({
        to: "/login",
        search: location.href === "/" ? {} : { next: location.href },
      });
    }
    await context.queryClient.ensureQueryData(authQueries.me());
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar footer={<UserMenu />} />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
