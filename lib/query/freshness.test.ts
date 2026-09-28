import { describe, expect, it } from "vitest";

import { dashboardQuery } from "@/lib/dashboard/queries";
import { parseOrderFilters } from "@/lib/orders/query";
import { orderQueries } from "@/lib/orders/queries";
import { parseProductFilters } from "@/lib/products/query";
import { productQueries } from "@/lib/products/queries";
import { FRESHNESS } from "@/lib/query/client";
import { shippingSettingsQuery } from "@/lib/settings/queries";
import { taxonomyQuery } from "@/lib/taxonomy/queries";

function freshness(options: { staleTime?: unknown; refetchInterval?: unknown }) {
  return { staleTime: options.staleTime, refetchInterval: options.refetchInterval };
}

describe("freshness classes", () => {
  it("polls what changes outside the admin constantly", () => {
    const live = { ...FRESHNESS.live };
    expect(freshness(dashboardQuery)).toEqual(live);
    expect(freshness(orderQueries.list(parseOrderFilters({})))).toEqual(live);
    expect(freshness(orderQueries.detail("o1"))).toEqual(live);
  });

  it("refetches stock-bearing products when shown again, without polling", () => {
    const volatile = { staleTime: FRESHNESS.volatile.staleTime, refetchInterval: undefined };
    expect(freshness(productQueries.list(parseProductFilters({})))).toEqual(volatile);
    expect(freshness(productQueries.detail("p1"))).toEqual(volatile);
  });

  it("keeps reference data for longer", () => {
    const reference = { staleTime: FRESHNESS.reference.staleTime, refetchInterval: undefined };
    expect(freshness(taxonomyQuery("brands"))).toEqual(reference);
    expect(freshness(shippingSettingsQuery)).toEqual(reference);
  });
});
