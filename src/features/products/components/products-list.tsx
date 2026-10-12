import { useQuery } from "@tanstack/react-query";
import { functionalUpdate, type SortingState, type Updater } from "@tanstack/react-table";

import { DEFAULT_PAGE_SIZE } from "@/lib/repositories/pagination";

import { toProductSort, toSorting } from "../product-sort";
import { productQueries } from "../queries/products.queries";
import type { ProductFilters as Filters } from "../schemas/product-filters.schema";
import { ProductFilters } from "./product-filters";
import { ProductsTable } from "./products-table";

export function ProductsList({
  filters,
  onFiltersChange,
}: {
  filters: Filters;
  onFiltersChange: (change: Partial<Filters>) => void;
}) {
  // A filter or page change keeps the previous rows on screen (placeholderData) until
  // the new ones arrive; only the very first load shows skeleton rows.
  const { data: page, isPending, isPlaceholderData } = useQuery(productQueries.list(filters));
  const { page: _page, sort: _sort, ...activeFilters } = filters;
  const isFiltered = Object.values(activeFilters).some((value) => value !== undefined);
  const sorting = toSorting(filters.sort);

  function handleSortingChange(updater: Updater<SortingState>) {
    onFiltersChange({ sort: toProductSort(functionalUpdate(updater, sorting)) });
  }

  return (
    <div className="flex flex-col gap-5 md:min-h-0">
      <ProductFilters filters={filters} onFiltersChange={onFiltersChange} />
      <ProductsTable
        products={page?.results ?? []}
        count={page?.count ?? 0}
        pageIndex={(filters.page ?? 1) - 1}
        pageSize={DEFAULT_PAGE_SIZE}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        isFiltered={isFiltered}
        isLoading={isPending}
        isPlaceholderData={isPlaceholderData}
      />
    </div>
  );
}
