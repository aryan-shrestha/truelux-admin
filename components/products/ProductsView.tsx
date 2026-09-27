"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { TablePagination } from "@/components/data-table/TablePagination";
import { UrlSearch } from "@/components/data-table/UrlSearch";
import { UrlSelect } from "@/components/data-table/UrlSelect";
import { ProductsTable } from "@/components/products/ProductsTable";
import { useTaxonomyOptions } from "@/components/taxonomy/use-taxonomy-options";
import { PRODUCTS_PAGE_SIZE, parseProductFilters, productsHref } from "@/lib/products/query";
import { productQueries } from "@/lib/products/queries";
import { paramsRecord } from "@/lib/search-params";

export function ProductsView() {
  const filters = parseProductFilters(paramsRecord(useSearchParams()));
  const { data: page } = useSuspenseQuery(productQueries.list(filters));
  const brands = useTaxonomyOptions("brands");
  const categories = useTaxonomyOptions("categories");
  const filtered = Boolean(
    filters.q || filters.brand || filters.category || filters.published || filters.lowStock,
  );

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <UrlSearch label="Search by name or SKU" />
        <UrlSelect param="brand" label="Brand" anyLabel="All brands" options={brands} />
        <UrlSelect
          param="category"
          label="Category"
          anyLabel="All categories"
          options={categories}
        />
        <UrlSelect
          param="published"
          label="Status"
          anyLabel="Any status"
          options={[
            { value: "yes", label: "Published" },
            { value: "no", label: "Draft" },
          ]}
        />
        <UrlSelect
          param="stock"
          label="Stock"
          anyLabel="Any stock"
          options={[{ value: "low", label: "Low stock" }]}
        />
      </div>
      <ProductsTable products={page.results} filtered={filtered} />
      <TablePagination
        page={filters.page}
        pageSize={PRODUCTS_PAGE_SIZE}
        count={page.count}
        hrefFor={(target) => productsHref({ ...filters, page: target })}
      />
    </div>
  );
}
