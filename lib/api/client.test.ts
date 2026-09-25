import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRead, apiWrite } from "@/lib/api/client";
import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import { errorResponse, jsonResponse } from "@/tests/fixtures/http";
import { fakeJwt } from "@/tests/fixtures/jwt";
import { RedirectSignal, cookieJar } from "@/tests/fixtures/next-server";

vi.mock("next/headers", async () => (await import("@/tests/fixtures/next-server")).headersModule);
vi.mock(
  "next/navigation",
  async () => (await import("@/tests/fixtures/next-server")).navigationModule,
);

const fetchMock = vi.fn<typeof fetch>();

function authHeader(call: number): string | null {
  const init = fetchMock.mock.calls[call]?.[1];
  return new Headers(init?.headers).get("Authorization");
}

beforeEach(() => {
  cookieJar.reset({ tl_access: "old-access", tl_refresh: "old-refresh" });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("apiWrite", () => {
  it("sends the access token and returns the parsed body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "p1" }, 201));

    await expect(apiWrite("/admin/products/", { method: "POST", body: {} })).resolves.toEqual({
      id: "p1",
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://api.test/api/v1/admin/products/");
    expect(authHeader(0)).toBe("Bearer old-access");
  });

  it("refreshes once on a 401, rewrites both cookies and retries", async () => {
    const pair = { access: fakeJwt(300), refresh: fakeJwt(86_400) };
    fetchMock
      .mockResolvedValueOnce(errorResponse(401, "authentication_failed"))
      .mockResolvedValueOnce(jsonResponse(pair))
      .mockResolvedValueOnce(jsonResponse({ id: "p1" }));

    await expect(apiWrite("/admin/products/p1/", { method: "PATCH", body: {} })).resolves.toEqual({
      id: "p1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://api.test/api/v1/auth/token/refresh/");
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(JSON.stringify({ refresh: "old-refresh" }));
    expect(authHeader(2)).toBe(`Bearer ${pair.access}`);
    expect(cookieJar.values.get("tl_access")).toBe(pair.access);
    expect(cookieJar.values.get("tl_refresh")).toBe(pair.refresh);
    for (const set of cookieJar.sets) {
      expect(set.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    }
  });

  it("does not refresh a second time when the retry is also a 401", async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(401, "authentication_failed"))
      .mockResolvedValueOnce(jsonResponse({ access: fakeJwt(300), refresh: fakeJwt(900) }))
      .mockResolvedValueOnce(errorResponse(401, "authentication_failed"));

    await expect(apiWrite("/admin/products/", { method: "POST" })).rejects.toMatchObject({
      code: "authentication_failed",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("clears the session and redirects to login when the refresh fails", async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(401, "authentication_failed"))
      .mockResolvedValueOnce(errorResponse(401, "authentication_failed"));

    const failure = apiWrite("/admin/products/", { method: "POST" });

    await expect(failure).rejects.toBeInstanceOf(RedirectSignal);
    await expect(failure).rejects.toMatchObject({ url: "/login" });
    expect(cookieJar.values.size).toBe(0);
  });

  it("throws the envelope's code, details and request id", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(409, "conflict", { product_count: 3 }));

    const error = await apiWrite("/admin/brands/b1/", { method: "DELETE" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "conflict",
      status: 409,
      requestId: "req-123",
      details: { product_count: 3 },
    });
  });

  it("reports a body without an envelope as server_error", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<html>Bad gateway</html>", { status: 502 }));

    await expect(apiWrite("/admin/products/", { method: "POST" })).rejects.toMatchObject({
      code: "server_error",
      status: 502,
    });
  });

  it("returns nothing for a 204", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiWrite("/admin/images/i1/", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("distinguishes a transport failure from an API answer", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(apiWrite("/admin/products/", { method: "POST" })).rejects.toBeInstanceOf(
      ApiUnreachableError,
    );
  });

  it("sends FormData untouched so fetch sets the multipart boundary", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "i1" }, 201));
    const form = new FormData();
    form.set("alt_text", "Front");

    await apiWrite("/admin/products/p1/images/", { method: "POST", body: form });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.body).toBe(form);
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });
});

describe("apiRead", () => {
  it("repeats array values and drops empty ones in the query", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ count: 0, next: null, previous: null, results: [] }),
    );

    await apiRead("/admin/orders/", { status: ["pending", "confirmed"], search: "", limit: 25 });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://api.test/api/v1/admin/orders/?status=pending&status=confirmed&limit=25",
    );
  });

  it("never refreshes during a render and sends the user to an expired sign-in", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(401, "authentication_failed"));

    await expect(apiRead("/admin/dashboard/")).rejects.toMatchObject({ url: "/login?expired=1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cookieJar.sets).toHaveLength(0);
  });

  it("treats a 403 from a de-staffed account as an ended session", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(403, "permission_denied"));

    await expect(apiRead("/auth/me/")).rejects.toMatchObject({ url: "/login?expired=1" });
  });

  it("rejects a path without its trailing slash before sending", async () => {
    await expect(apiRead("/admin/dashboard")).rejects.toThrow(/end in a slash/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
