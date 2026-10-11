import { ORDER_FILTERS_SCHEMA } from "./order-filters.schema";

describe("ORDER_FILTERS_SCHEMA", () => {
  it("keeps known statuses once each, in the API's order", () => {
    const filters = ORDER_FILTERS_SCHEMA.parse({
      status: ["confirmed", "bogus", "pending", "confirmed"],
    });

    expect(filters.status).toEqual(["pending", "confirmed"]);
  });

  it("accepts a single status and drops one it does not know", () => {
    expect(ORDER_FILTERS_SCHEMA.parse({ status: "shipped" }).status).toEqual(["shipped"]);
    expect(ORDER_FILTERS_SCHEMA.parse({ status: "bogus" }).status).toBeUndefined();
  });

  it("drops malformed dates, pages and an empty search instead of failing", () => {
    const filters = ORDER_FILTERS_SCHEMA.parse({
      from: "2026-13",
      to: "yesterday",
      page: 0,
      q: "  ",
    });

    expect(filters).toEqual({});
  });

  it("keeps valid dates, a page and a trimmed search", () => {
    const filters = ORDER_FILTERS_SCHEMA.parse({
      from: "2026-09-01",
      to: "2026-09-30",
      page: "3",
      q: " sita ",
    });

    expect(filters).toEqual({ from: "2026-09-01", to: "2026-09-30", page: 3, q: "sita" });
  });
});
