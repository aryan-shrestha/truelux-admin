"use client";

import { ProductDetailsForm } from "@/components/products/ProductDetailsForm";
import { useTaxonomyOptions } from "@/components/taxonomy/use-taxonomy-options";

export function NewProductView() {
  const brands = useTaxonomyOptions("brands");
  const categories = useTaxonomyOptions("categories");
  const skinTypes = useTaxonomyOptions("skin-types");

  return (
    <div className="p-4 md:p-6">
      <ProductDetailsForm brands={brands} categories={categories} skinTypes={skinTypes} />
    </div>
  );
}
