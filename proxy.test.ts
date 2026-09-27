import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "@/proxy";
import { errorResponse, jsonResponse } from "@/tests/fixtures/http";
import { fakeJwt } from "@/tests/fixtures/jwt";

const fetchMock = vi.fn<typeof fetch>();

function request(path: string, cookies: Record<string, string> = {}): NextRequest {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return new NextRequest(new URL(path, "http://admin.test"), { headers: { cookie } });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("proxy", () => {
  it("sends an anonymous request to login, remembering where it was going", async () => {
    const response = await proxy(request("/orders?status=pending"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/orders?status=pending");
  });

  it("lets an anonymous request reach the login page", async () => {
    const response = await proxy(request("/login"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("sends a signed-in visitor away from the login page", async () => {
    const response = await proxy(request("/login?next=/products", { tl_refresh: fakeJwt(900) }));

    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/products");
  });

  it("keeps an expired session on the login page instead of looping", async () => {
    const response = await proxy(request("/login?expired=1", { tl_refresh: fakeJwt(900) }));

    expect(response.headers.get("location")).toBeNull();
  });

  it("passes a request with a fresh access token straight through", async () => {
    const response = await proxy(
      request("/orders", { tl_access: fakeJwt(600), tl_refresh: fakeJwt(900) }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renews an expiring access token before the render and forwards the new pair", async () => {
    const pair = { access: fakeJwt(300), refresh: fakeJwt(86_400) };
    fetchMock.mockResolvedValueOnce(jsonResponse(pair));

    const response = await proxy(
      request("/orders", { tl_access: fakeJwt(10), tl_refresh: "old-refresh" }),
    );

    expect(response.cookies.get("tl_access")).toMatchObject({ value: pair.access, httpOnly: true });
    expect(response.cookies.get("tl_refresh")).toMatchObject({
      value: pair.refresh,
      httpOnly: true,
    });
    expect(response.headers.get("x-middleware-request-cookie")).toContain(pair.access);
  });

  it("sends a session whose refresh is rejected to an expired sign-in", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(401, "authentication_failed"));

    const response = await proxy(request("/products", { tl_refresh: "blacklisted" }));

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("expired")).toBe("1");
    expect(location.searchParams.get("next")).toBe("/products");
  });
});

describe("proxy on /api/*", () => {
  it("answers an anonymous fetch with a JSON 401 instead of a login redirect", async () => {
    const response = await proxy(request("/api/orders"));

    expect(response.status).toBe(401);
    expect(response.headers.get("location")).toBeNull();
    expect((await response.json()).error.code).toBe("authentication_failed");
  });

  it("asks the browser to refresh an expiring session and does not refresh itself", async () => {
    const response = await proxy(
      request("/api/orders", { tl_access: fakeJwt(10), tl_refresh: fakeJwt(900) }),
    );

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("session_refresh_required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lets the session endpoint through with an expired access token", async () => {
    const response = await proxy(request("/api/session", { tl_refresh: fakeJwt(900) }));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes a fetch with a fresh access token straight through", async () => {
    const response = await proxy(
      request("/api/orders", { tl_access: fakeJwt(600), tl_refresh: fakeJwt(900) }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
