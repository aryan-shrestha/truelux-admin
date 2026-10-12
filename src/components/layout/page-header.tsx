import { Link, type LinkProps } from "@tanstack/react-router";
import { Fragment, type ReactNode } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { RefreshButton } from "./refresh-button";
import { TopbarBreadcrumb } from "./topbar";

export interface Crumb {
  label: string;
  to?: LinkProps["to"];
}

export function PageHeader({
  crumbs,
  title,
  description,
  actions,
}: {
  crumbs: readonly Crumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <>
      <TopbarBreadcrumb>
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => (
              <Fragment key={crumb.label}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.to === undefined ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </TopbarBreadcrumb>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate font-heading text-2xl tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton />
          {actions}
        </div>
      </div>
    </>
  );
}
