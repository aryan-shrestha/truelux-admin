import type { Metadata } from "next";

import { TablePagination } from "@/components/data-table/TablePagination";
import { UrlSearch } from "@/components/data-table/UrlSearch";
import { DateRangeFilter } from "@/components/orders/DateRangeFilter";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { StatusTabs } from "@/components/orders/StatusTabs";
import { PageHeader } from "@/components/shell/PageHeader";
import { listOrders } from "@/lib/api/orders";
import { ORDERS_PAGE_SIZE, ordersHref, parseOrderFilters, toOrderQuery } from "@/lib/orders/query";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const filters = parseOrderFilters(await searchParams);
  const page = await listOrders(toOrderQuery(filters));
  const filtered = Boolean(filters.status.length || filters.q || filters.from || filters.to);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Shop" }, { label: "Orders" }]}
        title="Orders"
        description="Cash on delivery: confirm by phone, ship, then mark delivered once paid."
      />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <StatusTabs selected={filters.status} />
        <div className="flex flex-wrap items-center gap-2">
          <UrlSearch label="Search number, name, email or phone" />
          <DateRangeFilter from={filters.from} to={filters.to} />
        </div>
        <OrdersTable orders={page.results} filtered={filtered} />
        <TablePagination
          page={filters.page}
          pageSize={ORDERS_PAGE_SIZE}
          count={page.count}
          hrefFor={(target) => ordersHref({ ...filters, page: target })}
        />
      </div>
    </>
  );
}
