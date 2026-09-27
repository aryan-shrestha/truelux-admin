import { type QueryKey, queryOptions } from "@tanstack/react-query";

import type { Taxonomy, TaxonomyKind } from "@/lib/api/types";
import { productKeys } from "@/lib/products/queries";
import { getJson } from "@/lib/query/fetch-json";

// The lists change only when staff edit them here, and every edit invalidates them.
const TAXONOMY_STALE_TIME_MS = 5 * 60_000;

export const taxonomyKeys = {
  all: ["taxonomy"] as const,
  kind: (kind: TaxonomyKind) => [...taxonomyKeys.all, kind] as const,
};

export function taxonomyQuery<K extends TaxonomyKind>(kind: K) {
  return queryOptions({
    queryKey: taxonomyKeys.kind(kind),
    queryFn: ({ signal }) => getJson<Taxonomy[K][]>(`/api/taxonomy/${kind}`, undefined, signal),
    staleTime: TAXONOMY_STALE_TIME_MS,
  });
}

// Products show brand, category, size, shade and skin type names, so a taxonomy edit
// makes them stale too.
export function taxonomyInvalidates(kind: TaxonomyKind): QueryKey[] {
  return [taxonomyKeys.kind(kind), productKeys.all];
}
