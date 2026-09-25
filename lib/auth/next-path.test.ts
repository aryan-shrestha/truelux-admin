import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/auth/next-path";

describe("safeNextPath", () => {
  it("keeps a same-origin path with its query", () => {
    expect(safeNextPath("/orders?status=pending")).toBe("/orders?status=pending");
    expect(safeNextPath("/products/abc")).toBe("/products/abc");
  });

  it.each([
    "//evil.com",
    "//evil.com/orders",
    "/\\evil.com",
    "https://evil.com",
    "http:/evil.com",
    "javascript:alert(1)",
    "evil.com",
    "/..//evil.com",
    "/\tevil",
    "",
    null,
    undefined,
  ])("falls back to / for %s", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });

  it("leaves an encoded slash encoded, which browsers treat as a path", () => {
    expect(safeNextPath("/%2F%2Fevil.com")).toBe("/%2F%2Fevil.com");
  });

  it("never sends sign-in back to the login page", () => {
    expect(safeNextPath("/login?next=/orders")).toBe("/");
  });
});
