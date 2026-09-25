import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ImagesManager } from "@/components/products/ImagesManager";
import { ProductDetailsForm } from "@/components/products/ProductDetailsForm";
import { PRODUCT_TABS, type ProductTab, ProductTabs } from "@/components/products/ProductTabs";
import { VariantsEditor } from "@/components/products/VariantsEditor";
import { PageHeader } from "@/components/shell/PageHeader";
import { Badge } from "@/components/ui/badge";
import { hasCode } from "@/lib/api/errors";
import { getProduct } from "@/lib/api/products";
import { listTaxonomy } from "@/lib/api/taxonomy";
import type { Product } from "@/lib/api/types";
import { firstParam } from "@/lib/search-params";

export const metadata: Metadata = { title: "Edit product" };

async function findProduct(id: string): Promise<Product> {
  try {
    return await getProduct({ id });
  } catch (error) {
    if (hasCode(error, "not_found")) notFound();
    throw error;
  }
}

function isProductTab(value: string | undefined): value is ProductTab {
  return PRODUCT_TABS.some((tab) => tab === value);
}

export default async function ProductPage({ params, searchParams }: PageProps<"/products/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const requested = firstParam(query.tab);
  const [product, brands, categories, sizes, shades] = await Promise.all([
    findProduct(id),
    listTaxonomy("brands"),
    listTaxonomy("categories"),
    listTaxonomy("sizes"),
    listTaxonomy("shades"),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Products", href: "/products" }, { label: product.name }]}
        title={product.name}
        description={`by ${product.brand.name} in ${product.category.name}`}
      >
        {product.is_published ? <Badge variant="success">Published</Badge> : <Badge variant="outline">Draft</Badge>}
      </PageHeader>
      <div className="p-4 md:p-6">
        <ProductTabs
          tab={isProductTab(requested) ? requested : "details"}
          variantCount={product.variants.length}
          imageCount={product.images.length}
          details={
            <ProductDetailsForm
              product={product}
              brands={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
              categories={categories.map((category) => ({ value: category.id, label: category.name }))}
            />
          }
          variants={
            <VariantsEditor
              productId={product.id}
              variants={product.variants}
              sizes={sizes.map((size) => ({ value: size.id, label: size.name }))}
              shades={shades}
            />
          }
          images={<ImagesManager productId={product.id} images={product.images} />}
        />
      </div>
    </>
  );
}
