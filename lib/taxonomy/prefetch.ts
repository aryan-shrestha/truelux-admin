import "server-only";

import { listTaxonomy } from "@/lib/api/taxonomy";
import type { TaxonomyKind } from "@/lib/api/types";
import { getServerQueryClient } from "@/lib/query/server";
import { taxonomyQuery } from "@/lib/taxonomy/queries";

export async function prefetchTaxonomy(...kinds: TaxonomyKind[]): Promise<void> {
  const queryClient = getServerQueryClient();
  await Promise.all(
    kinds.map((kind) =>
      queryClient.fetchQuery({ ...taxonomyQuery(kind), queryFn: () => listTaxonomy(kind) }),
    ),
  );
}
