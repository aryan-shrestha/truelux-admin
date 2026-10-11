import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

import { productQueries } from "../queries/products.queries";
import { ProductForm } from "./product-form";

export function ProductDetail({ productId }: { productId: string }) {
  const { data: product } = useSuspenseQuery(productQueries.detail(productId));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: "Catalogue" },
          { label: "Products", to: "/products" },
          { label: product.name },
        ]}
        title={product.name}
      />
      <div>
        {product.is_published ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        )}
      </div>
      <ProductForm key={product.id} product={product} />
    </div>
  );
}
