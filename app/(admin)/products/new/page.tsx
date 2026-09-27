import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";

import { NewProductView } from "@/components/products/NewProductView";
import { PageHeader } from "@/components/shell/PageHeader";
import { getServerQueryClient } from "@/lib/query/server";
import { prefetchTaxonomy } from "@/lib/taxonomy/prefetch";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await prefetchTaxonomy("brands", "categories", "skin-types");

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Catalogue" },
          { label: "Products", href: "/products" },
          { label: "New" },
        ]}
        title="New product"
        description="Save the details first; variants and images come next."
      />
      <HydrationBoundary state={dehydrate(getServerQueryClient())}>
        <NewProductView />
      </HydrationBoundary>
    </>
  );
}
