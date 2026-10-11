import type { LinkProps } from "@tanstack/react-router";
import { LayoutDashboardIcon, type LucideIcon } from "lucide-react";

export interface NavigationItem {
  title: string;
  to: NonNullable<LinkProps["to"]>;
  icon: LucideIcon;
}

export interface NavigationGroup {
  label: string;
  items: readonly NavigationItem[];
}

// An entry is added when its route exists: `to` is type-checked against the route tree.
export const NAVIGATION: readonly NavigationGroup[] = [
  { label: "Shop", items: [{ title: "Dashboard", to: "/", icon: LayoutDashboardIcon }] },
];
