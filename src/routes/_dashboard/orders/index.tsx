import { createFileRoute } from "@tanstack/react-router";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import {
  ORDER_FILTERS_SCHEMA,
  orderQueries,
  OrdersList,
  type OrderFilters,
} from "@/features/orders";

export const Route = createFileRoute("/_dashboard/orders/")({
  validateSearch: ORDER_FILTERS_SCHEMA,
  loaderDeps: ({ search }) => search,
  // Not awaited: a filter or page change must not hold the navigation (and, after a
  // second, swap the page for the pending skeleton). The table keeps the previous rows
  // until the new ones arrive (tanstack-query.md#rules-for-features).
  loader: ({ context, deps }) => {
    void context.queryClient.ensureQueryData(orderQueries.list(deps));
  },
  component: OrdersPage,
});

function OrdersPage() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();

  // A new filter starts again from the first page; replace keeps typing out of history.
  function handleFiltersChange(change: Partial<OrderFilters>) {
    void navigate({
      search: (previous) => ({ ...previous, ...change, page: undefined }),
      replace: true,
    });
  }

  return (
    <Page>
      <PageHeader crumbs={[{ label: "Shop" }, { label: "Orders" }]} title="Orders" />
      <OrdersList filters={filters} onFiltersChange={handleFiltersChange} />
    </Page>
  );
}
