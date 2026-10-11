import { formatDay, parseIsoDate, toIsoDate } from "./date";

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
