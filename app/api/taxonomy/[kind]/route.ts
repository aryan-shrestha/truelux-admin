import { apiGet } from "@/lib/api/client";
import { errorResponse, respond } from "@/lib/api/route";
import { listTaxonomy } from "@/lib/api/taxonomy";
import { TAXONOMY_KINDS, type TaxonomyKind } from "@/lib/api/types";

function isKind(value: string): value is TaxonomyKind {
  return TAXONOMY_KINDS.some((kind) => kind === value);
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/taxonomy/[kind]">,
): Promise<Response> {
  const { kind } = await params;
  if (!isKind(kind)) {
    return errorResponse(404, "not_found", "No such list.");
  }
  return respond(() => listTaxonomy(kind, apiGet));
}
