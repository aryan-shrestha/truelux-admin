import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { SearchInput } from "@/components/data-table/search-input";
import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  BrandDialog,
  BrandsTable,
  TAXONOMY_SEARCH_SCHEMA,
  taxonomyQueries,
} from "@/features/taxonomy";

export const Route = createFileRoute("/_dashboard/brands")({
  validateSearch: TAXONOMY_SEARCH_SCHEMA,
  loader: ({ context }) => context.queryClient.ensureQueryData(taxonomyQueries.list("brands")),
  component: BrandsPage,
});

function BrandsPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Brands" }]}
        title="Brands"
        actions={
          <BrandDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" />
                New brand
              </Button>
            }
          />
        }
      />
      <SearchInput
        label="Search brands by name or slug"
        value={q}
        onSearch={(query) => void navigate({ search: { q: query || undefined }, replace: true })}
      />
      <BrandsTable query={q} />
    </Page>
  );
}
