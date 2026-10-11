import { createFileRoute, notFound } from "@tanstack/react-router";

import { PRODUCT_TAB_SCHEMA, ProductDetail, productQueries } from "@/features/products";
import { taxonomyQueries } from "@/features/taxonomy";
import { ApiError } from "@/lib/repositories/errors";

export const Route = createFileRoute("/_dashboard/products/$productId")({
  validateSearch: PRODUCT_TAB_SCHEMA,
  loader: async ({ context, params }) => {
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(productQueries.detail(params.productId)),
        context.queryClient.ensureQueryData(taxonomyQueries.list("brands")),
        context.queryClient.ensureQueryData(taxonomyQueries.list("categories")),
        context.queryClient.ensureQueryData(taxonomyQueries.list("skin-types")),
        context.queryClient.ensureQueryData(taxonomyQueries.list("sizes")),
        context.queryClient.ensureQueryData(taxonomyQueries.list("shades")),
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
  const { tab = "details" } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <ProductDetail
      productId={productId}
      tab={tab}
      onTabChange={(next) =>
        void navigate({ search: { tab: next === "details" ? undefined : next }, replace: true })
      }
    />
  );
}
