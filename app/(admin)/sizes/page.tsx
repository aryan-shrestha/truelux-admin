import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";

import { UrlSearch } from "@/components/data-table/UrlSearch";
import { PageHeader } from "@/components/shell/PageHeader";
import { SizeDialog } from "@/components/taxonomy/SizeDialog";
import { SizesTable } from "@/components/taxonomy/SizesTable";
import { Button } from "@/components/ui/button";
import { listTaxonomy } from "@/lib/api/taxonomy";
import { queryParam } from "@/lib/search-params";
import { matchingName } from "@/lib/taxonomy/search";

export const metadata: Metadata = { title: "Sizes" };

export default async function SizesPage({ searchParams }: PageProps<"/sizes">) {
  const query = queryParam(await searchParams);
  const sizes = matchingName(await listTaxonomy("sizes"), query);

  return (
    <>
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
        <SizesTable sizes={sizes} query={query} />
      </div>
    </>
  );
}
