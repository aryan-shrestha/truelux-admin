import { useMutation } from "@tanstack/react-query";

import { deleteTaxonomy, saveTaxonomy } from "../repositories/taxonomy.repository";
import type { TaxonomyKind } from "../schemas/taxonomy.schema";
import { taxonomyKeys } from "./taxonomy.queries";

// Products show taxonomy names, so the products feature adds its keys here when it
// exists (tanstack-query.md#rules-for-features).
export function useSaveTaxonomy<K extends TaxonomyKind>(kind: K) {
  return useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: FormData | object }) =>
      saveTaxonomy(kind, id, body),
    meta: { invalidates: [taxonomyKeys.kind(kind)] },
  });
}

export function useDeleteTaxonomy(kind: TaxonomyKind) {
  return useMutation({
    mutationFn: (id: string) => deleteTaxonomy(kind, id),
    meta: { invalidates: [taxonomyKeys.kind(kind)] },
  });
}
