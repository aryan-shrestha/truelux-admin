import { z } from "zod";

import { httpClient } from "@/lib/repositories/client";

import {
  TAXONOMY_SCHEMAS,
  type TaxonomyEntry,
  type TaxonomyKind,
} from "../schemas/taxonomy.schema";

// TypeScript cannot narrow TAXONOMY_SCHEMAS[kind] by K, so each parse is cast to the
// kind's own type; the schema that ran is that kind's.
export async function listTaxonomy<K extends TaxonomyKind>(kind: K): Promise<TaxonomyEntry<K>[]> {
  const response = await httpClient.get(`admin/${kind}/`);
  return z.array(TAXONOMY_SCHEMAS[kind]).parse(response.data) as TaxonomyEntry<K>[];
}

// `body` is JSON, or FormData for a brand with a new logo.
export async function saveTaxonomy<K extends TaxonomyKind>(
  kind: K,
  id: string | null,
  body: FormData | object,
): Promise<TaxonomyEntry<K>> {
  const response =
    id === null
      ? await httpClient.post(`admin/${kind}/`, body)
      : await httpClient.patch(`admin/${kind}/${id}/`, body);
  return TAXONOMY_SCHEMAS[kind].parse(response.data) as TaxonomyEntry<K>;
}

export async function deleteTaxonomy(kind: TaxonomyKind, id: string): Promise<void> {
  await httpClient.delete(`admin/${kind}/${id}/`);
}
