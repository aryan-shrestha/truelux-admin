import { describe, expect, it } from "vitest";

import { daysAgo, formatDateTime, formatDay, toIsoDate } from "@/lib/format/date";

describe("dates in Nepal time", () => {
  it("rolls a UTC evening over to the next Kathmandu day", () => {
    expect(toIsoDate(new Date("2026-09-24T19:00:00Z"))).toBe("2026-09-25");
  });

  it("counts days back from the Kathmandu date", () => {
    expect(daysAgo(6, new Date("2026-09-25T04:00:00Z"))).toBe("2026-09-19");
  });

  it("formats a timestamp with the shop's zone, not the server's", () => {
    expect(formatDateTime("2026-09-24T19:00:00Z")).toBe("25 Sept 2026, 00:45");
  });

  it("labels a calendar day without shifting it", () => {
    expect(formatDay("2026-09-01")).toBe("1 Sept");
  });
});
