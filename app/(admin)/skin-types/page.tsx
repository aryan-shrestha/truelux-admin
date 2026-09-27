import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";

import { UrlSearch } from "@/components/data-table/UrlSearch";
import { PageHeader } from "@/components/shell/PageHeader";
import { SkinTypeDialog } from "@/components/taxonomy/SkinTypeDialog";
import { SkinTypesTable } from "@/components/taxonomy/SkinTypesTable";
import { Button } from "@/components/ui/button";
import { getServerQueryClient } from "@/lib/query/server";
import { prefetchTaxonomy } from "@/lib/taxonomy/prefetch";

export const metadata: Metadata = { title: "Skin types" };

export default async function SkinTypesPage() {
  await prefetchTaxonomy("skin-types");

  return (
    <HydrationBoundary state={dehydrate(getServerQueryClient())}>
      <PageHeader crumbs={[{ label: "Catalogue" }, { label: "Skin types" }]} title="Skin types">
        <SkinTypeDialog
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              New skin type
            </Button>
          }
        />
      </PageHeader>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <UrlSearch label="Search skin types" />
        <SkinTypesTable />
      </div>
    </HydrationBoundary>
  );
}
