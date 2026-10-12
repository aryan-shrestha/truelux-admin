import type { LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  // Shown last, after a separator, in the destructive colour.
  isDestructive?: boolean;
}

// A row's actions, opened by right-clicking (or long-pressing) the row it wraps
// (`children`, a `TableRow`). The row's dialogs stay with whoever owns `actions`.
export function RowMenu({
  label,
  actions,
  children,
}: {
  label: string;
  actions: readonly RowAction[];
  children: ReactNode;
}) {
  return (
    <ContextMenu>
      {/* Tinted while its menu is open, so it is clear which row the menu acts on. */}
      <ContextMenuTrigger asChild className="data-[state=open]:bg-muted/50">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent aria-label={label}>
        {actions.map((action) => (
          <Fragment key={action.label}>
            {action.isDestructive && <ContextMenuSeparator />}
            <ContextMenuItem
              variant={action.isDestructive ? "destructive" : "default"}
              onSelect={action.onSelect}
            >
              <action.icon />
              {action.label}
            </ContextMenuItem>
          </Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
