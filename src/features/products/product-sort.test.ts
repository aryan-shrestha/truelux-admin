import { toProductSort, toSorting } from "./product-sort";

describe("product sort", () => {
  it("reads no sort as the API's default, name A to Z", () => {
    expect(toSorting(undefined)).toEqual([{ id: "name", desc: false }]);
  });

  it("reads a leading minus as descending", () => {
    expect(toSorting("-base_price")).toEqual([{ id: "base_price", desc: true }]);
  });

  it("writes the table's sort as the API's ordering, leaving the default out", () => {
    expect(toProductSort([{ id: "base_price", desc: true }])).toBe("-base_price");
    expect(toProductSort([{ id: "name", desc: true }])).toBe("-name");
    expect(toProductSort([{ id: "name", desc: false }])).toBeUndefined();
  });

  it("falls back to the default for a column the API cannot order", () => {
    expect(toProductSort([{ id: "total_stock", desc: false }])).toBeUndefined();
  });
});
