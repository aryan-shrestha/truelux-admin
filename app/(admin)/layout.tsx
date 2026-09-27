import { cookies } from "next/headers";

import { AppSidebar } from "@/components/shell/AppSidebar";
import { QueryProvider } from "@/components/shell/QueryProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getMe } from "@/lib/api/auth";
import { env } from "@/lib/env";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const [user, cookieStore] = await Promise.all([getMe(), cookies()]);
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <QueryProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar brandName={env.brandName} user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}
