"use client";

import {
  BoxIcon,
  FolderTreeIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  PaletteIcon,
  RulerIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "@/components/shell/UserMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { StaffUser } from "@/lib/api/types";

type NavItem = { title: string; href: string; icon: LucideIcon };

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Shop",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboardIcon },
      { title: "Orders", href: "/orders", icon: ShoppingBagIcon },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { title: "Products", href: "/products", icon: BoxIcon },
      { title: "Brands", href: "/brands", icon: TagIcon },
      { title: "Categories", href: "/categories", icon: FolderTreeIcon },
      { title: "Shades", href: "/shades", icon: PaletteIcon },
      { title: "Sizes", href: "/sizes", icon: RulerIcon },
      { title: "Skin types", href: "/skin-types", icon: SparklesIcon },
    ],
  },
  {
    label: "Settings",
    items: [{ title: "Shipping", href: "/settings/shipping", icon: TruckIcon }],
  },
];

function isCurrent(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarProps = {
  brandName: string;
  user: StaffUser;
};

export function AppSidebar({ brandName, user }: AppSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={brandName}>
              <Link href="/" onClick={() => setOpenMobile(false)}>
                <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center font-bold">
                  {brandName.charAt(0)}
                </span>
                <span className="flex flex-col gap-0.5 leading-tight">
                  <span translate="no" className="wordmark text-sm">
                    {brandName}
                  </span>
                  <span className="text-muted-foreground text-xs">Back office</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const current = isCurrent(pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={current} tooltip={item.title}>
                        <Link
                          href={item.href}
                          aria-current={current ? "page" : undefined}
                          onClick={() => setOpenMobile(false)}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
