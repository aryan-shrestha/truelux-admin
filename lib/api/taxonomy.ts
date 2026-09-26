import "server-only";

import { apiRead, apiWrite } from "@/lib/api/client";
import { mediaUrl } from "@/lib/api/media";
import type { Taxonomy, TaxonomyKind } from "@/lib/api/types";

function itemPath(kind: TaxonomyKind, id: string): string {
  return `/admin/${kind}/${encodeURIComponent(id)}/`;
}

function withLogoUrl<T extends object>(item: T): T {
  return "logo_url" in item && typeof item.logo_url === "string"
    ? { ...item, logo_url: mediaUrl(item.logo_url) }
    : item;
}

export async function listTaxonomy<K extends TaxonomyKind>(kind: K): Promise<Taxonomy[K][]> {
  const items = await apiRead<Taxonomy[K][]>(`/admin/${kind}/`);
  return items.map(withLogoUrl);
}

export async function createTaxonomy<K extends TaxonomyKind>(
  kind: K,
  body: FormData | object,
): Promise<Taxonomy[K]> {
  return withLogoUrl(await apiWrite<Taxonomy[K]>(`/admin/${kind}/`, { method: "POST", body }));
}

export async function updateTaxonomy<K extends TaxonomyKind>(
  kind: K,
  id: string,
  body: FormData | object,
): Promise<Taxonomy[K]> {
  return withLogoUrl(await apiWrite<Taxonomy[K]>(itemPath(kind, id), { method: "PATCH", body }));
}

export async function deleteTaxonomy(kind: TaxonomyKind, id: string): Promise<void> {
  return apiWrite<void>(itemPath(kind, id), { method: "DELETE" });
}
