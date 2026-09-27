import { describe, expect, it } from "vitest";

import { orderQueries } from "@/lib/orders/queries";
import { parseOrderFilters } from "@/lib/orders/query";

describe("query keys", () => {
  it("gives equal filters one cache entry whatever the status order", () => {
    const first = parseOrderFilters({ status: ["confirmed", "pending"], q: "asha" });
    const second = parseOrderFilters({ status: ["pending", "confirmed", "pending"], q: "asha" });

    expect(orderQueries.list(first).queryKey).toEqual(orderQueries.list(second).queryKey);
  });

  it("keeps different pages apart", () => {
    const pageOne = parseOrderFilters({});
    const pageTwo = parseOrderFilters({ page: "2" });

    expect(orderQueries.list(pageOne).queryKey).not.toEqual(orderQueries.list(pageTwo).queryKey);
  });
});
