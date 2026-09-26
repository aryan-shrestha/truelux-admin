import { describe, expect, it } from "vitest";

import { ORDER_STATUSES } from "@/lib/api/types";
import { ordersHref, parseOrderFilters, toOrderQuery } from "@/lib/orders/query";
import { ORDER_STATUS } from "@/lib/orders/status";

describe("order filters in the URL", () => {
  it("sends repeated statuses, the search and inclusive ISO dates to the API", () => {
    const filters = parseOrderFilters({
      status: ["pending", "confirmed"],
      q: "sita",
      from: "2026-09-01",
      to: "2026-09-25",
      page: "2",
    });

    expect(toOrderQuery(filters)).toEqual({
      status: ["pending", "confirmed"],
      search: "sita",
      created_after: "2026-09-01",
      created_before: "2026-09-25",
      limit: 25,
      offset: 25,
    });
  });

  it("ignores an unknown status and a malformed date", () => {
    const filters = parseOrderFilters({ status: ["paid", "shipped"], from: "yesterday" });

    expect(filters).toMatchObject({ status: ["shipped"], from: undefined });
  });

  it("round-trips through a link", () => {
    const filters = parseOrderFilters({ status: "pending", q: "TL-2026-0001" });

    expect(ordersHref({ ...filters, page: 3 })).toBe(
      "/orders?status=pending&q=TL-2026-0001&page=3",
    );
  });
});

describe("ORDER_STATUS", () => {
  it("gives every status a label and a distinct badge colour", () => {
    const badges = ORDER_STATUSES.map((status) => ORDER_STATUS[status].badge);

    expect(new Set(badges).size).toBe(ORDER_STATUSES.length);
  });
});
