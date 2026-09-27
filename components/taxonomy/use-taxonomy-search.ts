"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import type { Taxonomy, TaxonomyKind } from "@/lib/api/types";
import { paramsRecord, queryParam } from "@/lib/search-params";
import { taxonomyQuery } from "@/lib/taxonomy/queries";
import { matchingName } from "@/lib/taxonomy/search";

export function useTaxonomySearch<K extends TaxonomyKind>(
  kind: K,
): { items: Taxonomy[K][]; query: string } {
  const query = queryParam(paramsRecord(useSearchParams()));
  const { data: items } = useSuspenseQuery({
    ...taxonomyQuery(kind),
    select: (all: Taxonomy[K][]) => matchingName(all, query),
  });
  return { items, query };
}
