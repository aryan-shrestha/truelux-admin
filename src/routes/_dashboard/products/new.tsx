import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/features/products";
import { taxonomyQueries } from "@/features/taxonomy";

export const Route = createFileRoute("/_dashboard/products/new")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(taxonomyQueries.list("brands")),
      context.queryClient.ensureQueryData(taxonomyQueries.list("categories")),
      context.queryClient.ensureQueryData(taxonomyQueries.list("skin-types")),
    ]),
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = Route.useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Products", to: "/products" }, { label: "New" }]}
        title="New product"
        description="Variants and images are added once the product exists."
      />
      <ProductForm
        onCreated={(product) =>
          void navigate({
            to: "/products/$productId",
            params: { productId: product.id },
            search: { tab: "variants" },
          })
        }
      />
    </div>
  );
}
