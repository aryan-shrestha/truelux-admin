import { useSuspenseQuery } from "@tanstack/react-query";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { productQueries } from "../queries/products.queries";
import type { ProductTab } from "../schemas/product-tab.schema";
import { ProductForm } from "./product-form";
import { ImagesManager } from "./images-manager";
import { PublishButton } from "./publish-button";
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
    <Page>
      <PageHeader
        crumbs={[
          { label: "Catalogue" },
          { label: "Products", to: "/products" },
          { label: product.name },
        ]}
        title={product.name}
        leadingActions={<PublishButton product={product} />}
      />
      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as ProductTab)}
        className="md:min-h-0"
      >
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">Variants ({product.variants.length})</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="flex flex-col md:min-h-0">
          <ProductForm key={product.id} product={product} />
        </TabsContent>
        <TabsContent value="variants" className="flex flex-col md:min-h-0">
          <VariantsEditor product={product} />
        </TabsContent>
        <TabsContent value="images" className="flex flex-col md:min-h-0">
          <ImagesManager product={product} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
