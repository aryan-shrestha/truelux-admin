import { useQuery } from "@tanstack/react-query";

import { SearchInput } from "@/components/data-table/search-input";
import { DEFAULT_PAGE_SIZE } from "@/lib/repositories/pagination";

import { orderQueries } from "../queries/orders.queries";
import type { OrderFilters } from "../schemas/order-filters.schema";
import { DateRangeFilter } from "./date-range-filter";
import { OrdersTable } from "./orders-table";
import { StatusTabs } from "./status-tabs";

export function OrdersList({
  filters,
  onFiltersChange,
}: {
  filters: OrderFilters;
  onFiltersChange: (change: Partial<OrderFilters>) => void;
}) {
  // A filter or page change keeps the previous rows on screen (placeholderData) until
  // the new ones arrive; only the very first load shows skeleton rows.
  const { data: page, isPending, isPlaceholderData } = useQuery(orderQueries.list(filters));
  const isFiltered = Boolean(filters.status ?? filters.q ?? filters.from ?? filters.to);

  return (
    <div className="flex flex-col gap-4 md:min-h-0">
      <StatusTabs selected={filters.status} onSelect={(status) => onFiltersChange({ status })} />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          label="Search number, name, email or phone"
          value={filters.q}
          onSearch={(q) => onFiltersChange({ q: q || undefined })}
        />
        <DateRangeFilter
          from={filters.from}
          to={filters.to}
          onChange={(range) => onFiltersChange({ from: range?.from, to: range?.to })}
        />
      </div>
      <OrdersTable
        orders={page?.results ?? []}
        count={page?.count ?? 0}
        pageIndex={(filters.page ?? 1) - 1}
        pageSize={DEFAULT_PAGE_SIZE}
        isFiltered={isFiltered}
        isLoading={isPending}
        isPlaceholderData={isPlaceholderData}
      />
    </div>
  );
}
