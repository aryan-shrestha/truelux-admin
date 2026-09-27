"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { ImagesManager } from "@/components/products/ImagesManager";
import { ProductDetailsForm } from "@/components/products/ProductDetailsForm";
import { ProductTabs } from "@/components/products/ProductTabs";
import { VariantsEditor } from "@/components/products/VariantsEditor";
import { PageHeader } from "@/components/shell/PageHeader";
import { useTaxonomyOptions } from "@/components/taxonomy/use-taxonomy-options";
import { Badge } from "@/components/ui/badge";
import { parseProductTab } from "@/lib/products/query";
import { productQueries } from "@/lib/products/queries";
import { paramsRecord } from "@/lib/search-params";
import { taxonomyQuery } from "@/lib/taxonomy/queries";

export function ProductView({ id }: { id: string }) {
  const tab = parseProductTab(paramsRecord(useSearchParams()));
  const { data: product } = useSuspenseQuery(productQueries.detail(id));
  const { data: shades } = useSuspenseQuery(taxonomyQuery("shades"));
  const brands = useTaxonomyOptions("brands");
  const categories = useTaxonomyOptions("categories");
  const sizes = useTaxonomyOptions("sizes");
  const skinTypes = useTaxonomyOptions("skin-types");

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Catalogue" },
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
        title={product.name}
        description={`by ${product.brand.name} in ${product.category.name}`}
      >
        {product.is_published ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="outline">Draft</Badge>
        )}
      </PageHeader>
      <div className="p-4 md:p-6">
        <ProductTabs
          tab={tab}
          variantCount={product.variants.length}
          imageCount={product.images.length}
          details={
            <ProductDetailsForm
              product={product}
              brands={brands}
              categories={categories}
              skinTypes={skinTypes}
            />
          }
          variants={
            <VariantsEditor
              productId={product.id}
              variants={product.variants}
              sizes={sizes}
              shades={shades}
            />
          }
          images={<ImagesManager productId={product.id} images={product.images} />}
        />
      </div>
    </>
  );
}
