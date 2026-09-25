import type { Metadata } from "next";

import { ProductDetailsForm } from "@/components/products/ProductDetailsForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { listTaxonomy } from "@/lib/api/taxonomy";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    listTaxonomy("brands"),
    listTaxonomy("categories"),
  ]);

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
      <div className="p-4 md:p-6">
        <ProductDetailsForm
          brands={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
          categories={categories.map((category) => ({ value: category.id, label: category.name }))}
        />
      </div>
    </>
  );
}
