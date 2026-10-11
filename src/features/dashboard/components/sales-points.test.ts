import { toSalesPoints } from "./sales-points";

describe("toSalesPoints", () => {
  it("gives the chart one point per day, with the API's amount as its label", () => {
    const days = Array.from({ length: 30 }, (_, index) => ({
      date: `2026-09-${String(index + 1).padStart(2, "0")}`,
      orders: index,
      revenue: index === 1 ? "3200.00" : "0.00",
    }));

    const points = toSalesPoints(days);

    expect(points).toHaveLength(30);
    expect(points[1]).toEqual({
      day: "2 Sept",
      revenue: 3200,
      revenueLabel: "Rs 3,200.00",
      orders: 1,
    });
  });
});
