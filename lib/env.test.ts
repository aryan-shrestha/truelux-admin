import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("env", () => {
  it("strips a trailing slash from the API origin", async () => {
    vi.stubEnv("API_BASE_URL", "https://api.truelux.com/");
    const { env } = await import("@/lib/env");
    expect(env.apiBaseUrl).toBe("https://api.truelux.com");
  });

  it("fails when a variable is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_BRAND_NAME", "");
    await expect(import("@/lib/env")).rejects.toThrow(/NEXT_PUBLIC_BRAND_NAME/);
  });

  it("rejects an API origin that is not http(s)", async () => {
    vi.stubEnv("API_BASE_URL", "ftp://api.truelux.com");
    await expect(import("@/lib/env")).rejects.toThrow(/API_BASE_URL/);
  });
});
