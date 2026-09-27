import type { NextRequest } from "next/server";

import { apiGet } from "@/lib/api/client";
import { listOrders } from "@/lib/api/orders";
import { respond } from "@/lib/api/route";
import { parseOrderFilters, toOrderQuery } from "@/lib/orders/query";
import { paramsRecord } from "@/lib/search-params";

export function GET(request: NextRequest): Promise<Response> {
  const filters = parseOrderFilters(paramsRecord(request.nextUrl.searchParams));
  return respond(() => listOrders(toOrderQuery(filters), apiGet));
}
