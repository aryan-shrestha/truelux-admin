import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { SearchInput } from "@/components/data-table/search-input";
import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  CategoryDialog,
  CategoriesTable,
  TAXONOMY_SEARCH_SCHEMA,
  taxonomyQueries,
} from "@/features/taxonomy";

export const Route = createFileRoute("/_dashboard/categories")({
  validateSearch: TAXONOMY_SEARCH_SCHEMA,
  loader: ({ context }) => context.queryClient.ensureQueryData(taxonomyQueries.list("categories")),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Categories" }]}
        title="Categories"
        actions={
          <CategoryDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" />
                New category
              </Button>
            }
          />
        }
      />
      <SearchInput
        label="Search categories by name or slug"
        value={q}
        onSearch={(query) => void navigate({ search: { q: query || undefined }, replace: true })}
      />
      <CategoriesTable query={q} />
    </Page>
  );
}
