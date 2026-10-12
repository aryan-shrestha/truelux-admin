import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AuthenticatingScreen } from "@/components/feedback/authenticating-screen";
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
    // Waits only when the staff member is not cached yet (a first load, a reload, a
    // fresh sign-in): ensureQueryData returns cached data without fetching, so later
    // navigations carry on at once and token refreshes during them stay out of sight.
    await context.queryClient.ensureQueryData(authQueries.me());
  },
  // Shown at once while that first check runs (and refreshes the token, if needed);
  // nothing of the signed-in frame can show before it settles.
  pendingComponent: AuthenticatingScreen,
  pendingMs: 0,
  component: DashboardLayout,
});

function DashboardLayout() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    // From `md` up the frame is exactly the window's height and never scrolls; each page
    // decides what does (Page).
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen} className="md:h-svh">
      <AppSidebar footer={<UserMenu />} />
      <SidebarInset className="md:min-h-0">
        <Topbar>
          <div className="flex flex-1 flex-col md:min-h-0">
            <Outlet />
          </div>
        </Topbar>
      </SidebarInset>
    </SidebarProvider>
  );
}
