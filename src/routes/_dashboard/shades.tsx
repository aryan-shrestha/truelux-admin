import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { SearchInput } from "@/components/data-table/search-input";
import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  ShadeDialog,
  ShadesTable,
  TAXONOMY_SEARCH_SCHEMA,
  taxonomyQueries,
} from "@/features/taxonomy";

export const Route = createFileRoute("/_dashboard/shades")({
  validateSearch: TAXONOMY_SEARCH_SCHEMA,
  loader: ({ context }) => context.queryClient.ensureQueryData(taxonomyQueries.list("shades")),
  component: ShadesPage,
});

function ShadesPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Shades" }]}
        title="Shades"
        actions={
          <ShadeDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" />
                New shade
              </Button>
            }
          />
        }
      />
      <SearchInput
        label="Search shades by name or slug"
        value={q}
        onSearch={(query) => void navigate({ search: { q: query || undefined }, replace: true })}
      />
      <ShadesTable query={q} />
    </Page>
  );
}
