import { queryOptions } from "@tanstack/react-query";

import type { Taxonomy, TaxonomyKind } from "@/lib/api/types";
import { FRESHNESS } from "@/lib/query/client";
import { getJson } from "@/lib/query/get-json";

export const taxonomyKeys = {
  all: ["taxonomy"] as const,
  kind: (kind: TaxonomyKind) => [...taxonomyKeys.all, kind] as const,
};

export function taxonomyQuery<K extends TaxonomyKind>(kind: K) {
  return queryOptions({
    queryKey: taxonomyKeys.kind(kind),
    queryFn: ({ signal }) => getJson<Taxonomy[K][]>(`/api/taxonomy/${kind}`, undefined, signal),
    ...FRESHNESS.reference,
  });
}
