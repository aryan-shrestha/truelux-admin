import type { LinkProps } from "@tanstack/react-router";
import { LayoutDashboardIcon, type LucideIcon } from "lucide-react";

export interface NavigationItem {
  title: string;
  to: NonNullable<LinkProps["to"]>;
  icon: LucideIcon;
}

export const NAVIGATION: readonly NavigationItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboardIcon },
];
