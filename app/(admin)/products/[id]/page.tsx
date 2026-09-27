import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductView } from "@/components/products/ProductView";
import { hasCode } from "@/lib/api/errors";
import { getProduct } from "@/lib/api/products";
import type { Product } from "@/lib/api/types";
import { productQueries } from "@/lib/products/queries";
import { getServerQueryClient } from "@/lib/query/server";
import { prefetchTaxonomy } from "@/lib/taxonomy/prefetch";

export const metadata: Metadata = { title: "Edit product" };

async function findProduct(id: string): Promise<Product> {
  try {
    return await getProduct({ id });
  } catch (error) {
    if (hasCode(error, "not_found")) notFound();
    throw error;
  }
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const queryClient = getServerQueryClient();
  const [product] = await Promise.all([
    findProduct(id),
    prefetchTaxonomy("brands", "categories", "sizes", "shades", "skin-types"),
  ]);
  queryClient.setQueryData(productQueries.detail(id).queryKey, product);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductView id={id} />
    </HydrationBoundary>
  );
}
