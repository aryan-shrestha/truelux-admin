import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TablePagination } from "@/components/data-table/TablePagination";
import { UrlSearch } from "@/components/data-table/UrlSearch";
import { UrlSelect } from "@/components/data-table/UrlSelect";
import { ProductsTable } from "@/components/products/ProductsTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/api/products";
import { listTaxonomy } from "@/lib/api/taxonomy";
import {
  PRODUCTS_PAGE_SIZE,
  parseProductFilters,
  productsHref,
  toProductQuery,
} from "@/lib/products/query";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const filters = parseProductFilters(await searchParams);
  const [page, brands, categories] = await Promise.all([
    listProducts(toProductQuery(filters)),
    listTaxonomy("brands"),
    listTaxonomy("categories"),
  ]);
  const filtered = Boolean(
    filters.q || filters.brand || filters.category || filters.published || filters.lowStock,
  );

  return (
    <>
      <PageHeader crumbs={[{ label: "Catalogue" }, { label: "Products" }]} title="Products">
        <Button asChild>
          <Link href="/products/new">
            <PlusIcon data-icon="inline-start" />
            New product
          </Link>
        </Button>
      </PageHeader>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <UrlSearch label="Search by name or SKU" />
          <UrlSelect
            param="brand"
            label="Brand"
            anyLabel="All brands"
            options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
          />
          <UrlSelect
            param="category"
            label="Category"
            anyLabel="All categories"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
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
    </>
  );
}
