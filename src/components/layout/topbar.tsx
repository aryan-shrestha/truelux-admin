import { createContext, use, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { SidebarTrigger } from "@/components/ui/sidebar";

const BreadcrumbSlotContext = createContext<HTMLElement | null>(null);

// The page under the top bar owns its breadcrumb (PageHeader), so the top bar keeps an
// empty slot that the page portals into.
export function Topbar({ children }: { children: ReactNode }) {
  const [breadcrumbSlot, setBreadcrumbSlot] = useState<HTMLElement | null>(null);

  return (
    <BreadcrumbSlotContext value={breadcrumbSlot}>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div ref={setBreadcrumbSlot} className="ml-auto min-w-0" />
      </header>
      {children}
    </BreadcrumbSlotContext>
  );
}

export function TopbarBreadcrumb({ children }: { children: ReactNode }) {
  const breadcrumbSlot = use(BreadcrumbSlotContext);
  return breadcrumbSlot && createPortal(children, breadcrumbSlot);
}
