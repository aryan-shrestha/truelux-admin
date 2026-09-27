import type { NextRequest } from "next/server";

import { apiGet } from "@/lib/api/client";
import { listProducts } from "@/lib/api/products";
import { respond } from "@/lib/api/route";
import { parseProductFilters, toProductQuery } from "@/lib/products/query";
import { paramsRecord } from "@/lib/search-params";

export function GET(request: NextRequest): Promise<Response> {
  const filters = parseProductFilters(paramsRecord(request.nextUrl.searchParams));
  return respond(() => listProducts(toProductQuery(filters), apiGet));
}
