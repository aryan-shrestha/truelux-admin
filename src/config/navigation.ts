import type { LinkProps } from "@tanstack/react-router";
import {
  DropletsIcon,
  FolderTreeIcon,
  LayoutDashboardIcon,
  PaletteIcon,
  RulerIcon,
  ShoppingBagIcon,
  TagIcon,
  type LucideIcon,
} from "lucide-react";

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
  {
    label: "Shop",
    items: [
      { title: "Dashboard", to: "/", icon: LayoutDashboardIcon },
      { title: "Orders", to: "/orders", icon: ShoppingBagIcon },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { title: "Brands", to: "/brands", icon: TagIcon },
      { title: "Categories", to: "/categories", icon: FolderTreeIcon },
      { title: "Shades", to: "/shades", icon: PaletteIcon },
      { title: "Sizes", to: "/sizes", icon: RulerIcon },
      { title: "Skin types", to: "/skin-types", icon: DropletsIcon },
    ],
  },
];
