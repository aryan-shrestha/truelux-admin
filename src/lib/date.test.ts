import { formatDay, parseIsoDate, shopDaysAgo, toIsoDate } from "./date";

describe("calendar days", () => {
  it("reads an ISO day as that local day and writes it back unchanged", () => {
    const date = parseIsoDate("2026-09-01");

    expect(date.getDate()).toBe(1);
    expect(date.getMonth()).toBe(8);
    expect(toIsoDate(date)).toBe("2026-09-01");
  });

  it("labels a day without shifting it", () => {
    expect(formatDay("2026-09-01")).toBe("1 Sept 2026");
  });
});

describe("shopDaysAgo", () => {
  it("counts back the shop's Kathmandu days, whatever the browser's zone", () => {
    const lateEveningUtc = new Date("2026-10-03T19:00:00Z");

    expect(shopDaysAgo(0, lateEveningUtc)).toBe("2026-10-04");
    expect(shopDaysAgo(6, lateEveningUtc)).toBe("2026-09-28");
    expect(shopDaysAgo(29, lateEveningUtc)).toBe("2026-09-05");
  });
});
