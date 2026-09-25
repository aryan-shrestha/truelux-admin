import "server-only";

import { apiRead, apiWrite } from "@/lib/api/client";
import type { Taxonomy, TaxonomyKind } from "@/lib/api/types";

function itemPath(kind: TaxonomyKind, id: string): string {
  return `/admin/${kind}/${encodeURIComponent(id)}/`;
}

export async function listTaxonomy<K extends TaxonomyKind>(kind: K): Promise<Taxonomy[K][]> {
  return apiRead<Taxonomy[K][]>(`/admin/${kind}/`);
}

export async function createTaxonomy<K extends TaxonomyKind>(
  kind: K,
  body: FormData | object,
): Promise<Taxonomy[K]> {
  return apiWrite<Taxonomy[K]>(`/admin/${kind}/`, { method: "POST", body });
}

export async function updateTaxonomy<K extends TaxonomyKind>(
  kind: K,
  id: string,
  body: FormData | object,
): Promise<Taxonomy[K]> {
  return apiWrite<Taxonomy[K]>(itemPath(kind, id), { method: "PATCH", body });
}

export async function deleteTaxonomy(kind: TaxonomyKind, id: string): Promise<void> {
  return apiWrite<void>(itemPath(kind, id), { method: "DELETE" });
}
