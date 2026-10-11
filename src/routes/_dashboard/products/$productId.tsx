import { createFileRoute, notFound } from "@tanstack/react-router";

import { ProductDetail, productQueries } from "@/features/products";
import { taxonomyQueries } from "@/features/taxonomy";
import { ApiError } from "@/lib/repositories/errors";

export const Route = createFileRoute("/_dashboard/products/$productId")({
  loader: async ({ context, params }) => {
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(productQueries.detail(params.productId)),
        context.queryClient.ensureQueryData(taxonomyQueries.list("brands")),
        context.queryClient.ensureQueryData(taxonomyQueries.list("categories")),
        context.queryClient.ensureQueryData(taxonomyQueries.list("skin-types")),
      ]);
    } catch (error) {
      if (error instanceof ApiError && error.code === "not_found") throw notFound();
      throw error;
    }
  },
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  return <ProductDetail productId={productId} />;
}
