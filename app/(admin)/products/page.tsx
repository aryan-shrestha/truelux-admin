import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ProductsView } from "@/components/products/ProductsView";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/api/products";
import { parseProductFilters, toProductQuery } from "@/lib/products/query";
import { productQueries } from "@/lib/products/queries";
import { getServerQueryClient } from "@/lib/query/server";
import { prefetchTaxonomy } from "@/lib/taxonomy/prefetch";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const filters = parseProductFilters(await searchParams);
  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.fetchQuery({
      ...productQueries.list(filters),
      queryFn: () => listProducts(toProductQuery(filters)),
    }),
    prefetchTaxonomy("brands", "categories"),
  ]);

  return (
    <>
      <PageHeader crumbs={[{ label: "Catalogue" }, { label: "Products" }]} title="Products">
        <Button asChild>
          <Link href="/products/new">
            <PlusIcon data-icon="inline-start" />
            New product
          </Link>
        </Button>
      </PageHeader>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductsView />
      </HydrationBoundary>
    </>
  );
}
