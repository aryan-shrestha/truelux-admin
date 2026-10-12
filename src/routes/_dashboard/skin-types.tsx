import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { SearchInput } from "@/components/data-table/search-input";
import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  SkinTypeDialog,
  SkinTypesTable,
  TAXONOMY_SEARCH_SCHEMA,
  taxonomyQueries,
} from "@/features/taxonomy";

export const Route = createFileRoute("/_dashboard/skin-types")({
  validateSearch: TAXONOMY_SEARCH_SCHEMA,
  loader: ({ context }) => context.queryClient.ensureQueryData(taxonomyQueries.list("skin-types")),
  component: SkintypesPage,
});

function SkintypesPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Skin types" }]}
        title="Skin types"
        actions={
          <SkinTypeDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" />
                New skin type
              </Button>
            }
          />
        }
      />
      <SearchInput
        label="Search skin types by name or slug"
        value={q}
        onSearch={(query) => void navigate({ search: { q: query || undefined }, replace: true })}
      />
      <SkinTypesTable query={q} />
    </Page>
  );
}
