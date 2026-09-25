import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";

import { UrlSearch } from "@/components/data-table/UrlSearch";
import { PageHeader } from "@/components/shell/PageHeader";
import { CategoriesTable } from "@/components/taxonomy/CategoriesTable";
import { CategoryDialog } from "@/components/taxonomy/CategoryDialog";
import { Button } from "@/components/ui/button";
import { listTaxonomy } from "@/lib/api/taxonomy";
import { queryParam } from "@/lib/search-params";
import { toCategoryRows } from "@/lib/taxonomy/category-tree";
import { matchingName } from "@/lib/taxonomy/search";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: PageProps<"/categories">) {
  const query = queryParam(await searchParams);
  const categories = await listTaxonomy("categories");
  const roots = categories
    .filter((category) => category.parent_id === null)
    .map((category) => ({ value: category.id, label: category.name }));

  return (
    <>
      <PageHeader crumbs={[{ label: "Catalogue" }, { label: "Categories" }]} title="Categories">
        <CategoryDialog
          roots={roots}
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              New category
            </Button>
          }
        />
      </PageHeader>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <UrlSearch label="Search categories" />
        <CategoriesTable
          rows={toCategoryRows(matchingName(categories, query))}
          roots={roots}
          query={query}
        />
      </div>
    </>
  );
}
