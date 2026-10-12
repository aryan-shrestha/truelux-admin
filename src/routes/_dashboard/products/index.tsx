import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_FILTERS_SCHEMA,
  productQueries,
  ProductsList,
  type ProductFilters,
} from "@/features/products";
import { taxonomyQueries } from "@/features/taxonomy";

export const Route = createFileRoute("/_dashboard/products/")({
  validateSearch: PRODUCT_FILTERS_SCHEMA,
  loaderDeps: ({ search }) => search,
  // The brand and category filters need their options; the list itself is not awaited,
  // so a filter change keeps the previous rows instead of blocking (convention.md).
  loader: async ({ context, deps }) => {
    void context.queryClient.ensureQueryData(productQueries.list(deps));
    await Promise.all([
      context.queryClient.ensureQueryData(taxonomyQueries.list("brands")),
      context.queryClient.ensureQueryData(taxonomyQueries.list("categories")),
    ]);
  },
  component: ProductsPage,
});

function ProductsPage() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();

  // A new filter starts again from the first page; replace keeps typing out of history.
  function handleFiltersChange(change: Partial<ProductFilters>) {
    void navigate({
      search: (previous) => ({ ...previous, ...change, page: undefined }),
      replace: true,
    });
  }

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Products" }]}
        title="Products"
        actions={
          <Button asChild>
            <Link to="/products/new">
              <PlusIcon data-icon="inline-start" />
              New product
            </Link>
          </Button>
        }
      />
      <ProductsList filters={filters} onFiltersChange={handleFiltersChange} />
    </Page>
  );
}
