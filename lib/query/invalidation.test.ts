import { describe, expect, it } from "vitest";

import {
  afterOrderMove,
  afterProductChange,
  afterProductCreate,
  afterTaxonomyChange,
  afterVariantChange,
} from "@/lib/query/invalidation";

describe("invalidation map", () => {
  it("sends a product change to its detail, the lists and the taxonomy counts", () => {
    expect(afterProductChange("p1")).toEqual([
      ["products", "detail", "p1"],
      ["products", "list"],
      ["taxonomy"],
    ]);
    expect(afterProductCreate()).toContainEqual(["taxonomy"]);
  });

  it("sends a variant change to the dashboard's low-stock list too", () => {
    expect(afterVariantChange("p1")).toContainEqual(["dashboard"]);
  });

  it("sends an order move to products, since a cancel restores stock", () => {
    expect(afterOrderMove()).toEqual([["orders", "list"], ["dashboard"], ["products"]]);
  });

  it("sends a taxonomy change to products, which show its names", () => {
    expect(afterTaxonomyChange("brands")).toEqual([["taxonomy", "brands"], ["products"]]);
  });
});
