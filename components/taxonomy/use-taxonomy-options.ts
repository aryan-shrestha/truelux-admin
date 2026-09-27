"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import type { SelectOption } from "@/components/form/SelectField";
import type { TaxonomyKind } from "@/lib/api/types";
import { taxonomyQuery } from "@/lib/taxonomy/queries";

function toOptions(items: { id: string; name: string }[]): SelectOption[] {
  return items.map((item) => ({ value: item.id, label: item.name }));
}

export function useTaxonomyOptions(kind: TaxonomyKind): SelectOption[] {
  return useSuspenseQuery({ ...taxonomyQuery(kind), select: toOptions }).data;
}
