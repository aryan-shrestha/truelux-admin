import { queryOptions } from "@tanstack/react-query";

import { FRESHNESS } from "@/lib/freshness";

import { listTaxonomy } from "../repositories/taxonomy.repository";
import type { TaxonomyKind } from "../schemas/taxonomy.schema";

export const taxonomyKeys = {
  all: ["taxonomy"] as const,
  kind: (kind: TaxonomyKind) => [...taxonomyKeys.all, kind] as const,
};

export const taxonomyQueries = {
  list: <K extends TaxonomyKind>(kind: K) =>
    queryOptions({
      queryKey: taxonomyKeys.kind(kind),
      queryFn: () => listTaxonomy(kind),
      ...FRESHNESS.reference,
    }),
};
