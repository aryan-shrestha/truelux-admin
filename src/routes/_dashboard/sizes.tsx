import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { SearchInput } from "@/components/data-table/search-input";
import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  SizeDialog,
  SizesTable,
  TAXONOMY_SEARCH_SCHEMA,
  taxonomyQueries,
} from "@/features/taxonomy";

export const Route = createFileRoute("/_dashboard/sizes")({
  validateSearch: TAXONOMY_SEARCH_SCHEMA,
  loader: ({ context }) => context.queryClient.ensureQueryData(taxonomyQueries.list("sizes")),
  component: SizesPage,
});

function SizesPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Sizes" }]}
        title="Sizes"
        actions={
          <SizeDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" />
                New size
              </Button>
            }
          />
        }
      />
      <SearchInput
        label="Search sizes by name or slug"
        value={q}
        onSearch={(query) => void navigate({ search: { q: query || undefined }, replace: true })}
      />
      <SizesTable query={q} />
    </Page>
  );
}
