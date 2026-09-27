"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { TablePagination } from "@/components/data-table/TablePagination";
import { UrlSearch } from "@/components/data-table/UrlSearch";
import { DateRangeFilter } from "@/components/orders/DateRangeFilter";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { StatusTabs } from "@/components/orders/StatusTabs";
import { ORDERS_PAGE_SIZE, ordersHref, parseOrderFilters } from "@/lib/orders/query";
import { orderQueries } from "@/lib/orders/queries";
import { paramsRecord } from "@/lib/search-params";

export function OrdersView() {
  const filters = parseOrderFilters(paramsRecord(useSearchParams()));
  const { data: page } = useSuspenseQuery(orderQueries.list(filters));
  const filtered = Boolean(filters.status.length || filters.q || filters.from || filters.to);

  return (
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
  );
}
