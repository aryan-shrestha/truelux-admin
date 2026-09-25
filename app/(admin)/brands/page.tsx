import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";

import { UrlSearch } from "@/components/data-table/UrlSearch";
import { PageHeader } from "@/components/shell/PageHeader";
import { BrandDialog } from "@/components/taxonomy/BrandDialog";
import { BrandsTable } from "@/components/taxonomy/BrandsTable";
import { Button } from "@/components/ui/button";
import { listTaxonomy } from "@/lib/api/taxonomy";
import { queryParam } from "@/lib/search-params";
import { matchingName } from "@/lib/taxonomy/search";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage({ searchParams }: PageProps<"/brands">) {
  const query = queryParam(await searchParams);
  const brands = matchingName(await listTaxonomy("brands"), query);

  return (
    <>
      <PageHeader crumbs={[{ label: "Catalogue" }, { label: "Brands" }]} title="Brands">
        <BrandDialog
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              New brand
            </Button>
          }
        />
      </PageHeader>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <UrlSearch label="Search brands" />
        <BrandsTable brands={brands} query={query} />
      </div>
    </>
  );
}
