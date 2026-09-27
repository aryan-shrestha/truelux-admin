import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/session/route";
import { errorResponse, jsonResponse } from "@/tests/fixtures/http";
import { fakeJwt } from "@/tests/fixtures/jwt";
import { cookieJar } from "@/tests/fixtures/next-server";

vi.mock("next/headers", async () => (await import("@/tests/fixtures/next-server")).headersModule);

const fetchMock = vi.fn<typeof fetch>();

function post(origin: string | null): NextRequest {
  const headers: Record<string, string> = origin ? { origin } : {};
  return new NextRequest("http://admin.test/api/session", { method: "POST", headers });
}

beforeEach(() => {
  cookieJar.reset({ tl_access: "old-access", tl_refresh: "old-refresh" });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("POST /api/session", () => {
  it("rotates the pair and writes both cookies", async () => {
    const pair = { access: fakeJwt(900), refresh: fakeJwt(86_400) };
    fetchMock.mockResolvedValueOnce(jsonResponse(pair));

    const response = await POST(post("http://admin.test"));

    expect(response.status).toBe(204);
    expect(cookieJar.values.get("tl_access")).toBe(pair.access);
    expect(cookieJar.values.get("tl_refresh")).toBe(pair.refresh);
  });

  it("refuses a cross-origin request without touching the session", async () => {
    const response = await POST(post("https://evil.test"));

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers a refused refresh with authentication_failed and keeps the cookies", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(401, "authentication_failed"));

    const response = await POST(post("http://admin.test"));

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("authentication_failed");
    expect(cookieJar.values.get("tl_refresh")).toBe("old-refresh");
  });
});
