import { useSuspenseQuery } from "@tanstack/react-query";

import { taxonomyQueries } from "./queries/taxonomy.queries";
import type { TaxonomyEntry, TaxonomyKind } from "./schemas/taxonomy.schema";

// The whole list is already cached (the API does not paginate taxonomy), so a search
// filters it in the browser and never makes a request.
export function useTaxonomySearch<K extends TaxonomyKind>(kind: K, query: string | undefined) {
  const needle = query?.toLowerCase();
  const { data } = useSuspenseQuery({
    ...taxonomyQueries.list(kind),
    select: (entries: TaxonomyEntry<K>[]) =>
      needle === undefined
        ? entries
        : entries.filter(
            (entry) =>
              entry.name.toLowerCase().includes(needle) ||
              entry.slug.toLowerCase().includes(needle),
          ),
  });
  return data;
}
