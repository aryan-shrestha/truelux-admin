import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";

import { UrlSearch } from "@/components/data-table/UrlSearch";
import { PageHeader } from "@/components/shell/PageHeader";
import { SizeDialog } from "@/components/taxonomy/SizeDialog";
import { SizesTable } from "@/components/taxonomy/SizesTable";
import { Button } from "@/components/ui/button";
import { getServerQueryClient } from "@/lib/query/server";
import { prefetchTaxonomy } from "@/lib/taxonomy/prefetch";

export const metadata: Metadata = { title: "Sizes" };

export default async function SizesPage() {
  await prefetchTaxonomy("sizes");

  return (
    <HydrationBoundary state={dehydrate(getServerQueryClient())}>
      <PageHeader crumbs={[{ label: "Catalogue" }, { label: "Sizes" }]} title="Sizes">
        <SizeDialog
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              New size
            </Button>
          }
        />
      </PageHeader>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <UrlSearch label="Search sizes" />
        <SizesTable />
      </div>
    </HydrationBoundary>
  );
}
