import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { productQueries } from "../queries/products.queries";
import type { ProductTab } from "../schemas/product-tab.schema";
import { ProductForm } from "./product-form";
import { VariantsEditor } from "./variants-editor";

export function ProductDetail({
  productId,
  tab,
  onTabChange,
}: {
  productId: string;
  tab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
}) {
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
      <div className="flex flex-wrap items-center gap-2">
        {product.is_published ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        )}
        <span className="text-sm text-muted-foreground">
          {product.variants.length} {product.variants.length === 1 ? "variant" : "variants"}
        </span>
      </div>
      <Tabs value={tab} onValueChange={(value) => onTabChange(value as ProductTab)}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <ProductForm key={product.id} product={product} />
        </TabsContent>
        <TabsContent value="variants">
          <VariantsEditor product={product} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
