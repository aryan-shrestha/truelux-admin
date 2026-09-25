import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";

import { UrlSearch } from "@/components/data-table/UrlSearch";
import { PageHeader } from "@/components/shell/PageHeader";
import { ShadeDialog } from "@/components/taxonomy/ShadeDialog";
import { ShadesTable } from "@/components/taxonomy/ShadesTable";
import { Button } from "@/components/ui/button";
import { listTaxonomy } from "@/lib/api/taxonomy";
import { queryParam } from "@/lib/search-params";
import { matchingName } from "@/lib/taxonomy/search";

export const metadata: Metadata = { title: "Shades" };

export default async function ShadesPage({ searchParams }: PageProps<"/shades">) {
  const query = queryParam(await searchParams);
  const shades = matchingName(await listTaxonomy("shades"), query);

  return (
    <>
      <PageHeader crumbs={[{ label: "Catalogue" }, { label: "Shades" }]} title="Shades">
        <ShadeDialog
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              New shade
            </Button>
          }
        />
      </PageHeader>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <UrlSearch label="Search shades" />
        <ShadesTable shades={shades} query={query} />
      </div>
    </>
  );
}
