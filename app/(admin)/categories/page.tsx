import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";

import { UrlSearch } from "@/components/data-table/UrlSearch";
import { PageHeader } from "@/components/shell/PageHeader";
import { CategoryDialog } from "@/components/taxonomy/CategoryDialog";
import { CategoriesTable } from "@/components/taxonomy/CategoriesTable";
import { Button } from "@/components/ui/button";
import { getServerQueryClient } from "@/lib/query/server";
import { prefetchTaxonomy } from "@/lib/taxonomy/prefetch";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await prefetchTaxonomy("categories");

  return (
    <HydrationBoundary state={dehydrate(getServerQueryClient())}>
      <PageHeader crumbs={[{ label: "Catalogue" }, { label: "Categories" }]} title="Categories">
        <CategoryDialog
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
        <CategoriesTable />
      </div>
    </HydrationBoundary>
  );
}
