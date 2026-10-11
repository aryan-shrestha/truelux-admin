import { http, HttpResponse } from "msw";

import { server } from "@/test/msw-server";

import { httpClient } from "./client";
import { ApiError } from "./errors";
import { readSession, saveSession } from "./session";

const assign = vi.fn();

function errorEnvelope(status: number, code: string) {
  return HttpResponse.json({ error: { code, message: code, details: {} } }, { status });
}

function ordersAcceptingOnly(authorization: string) {
  return http.get("*/api/v1/admin/orders/", ({ request }) =>
    request.headers.get("Authorization") === authorization
      ? HttpResponse.json({ count: 0 })
      : errorEnvelope(401, "authentication_failed"),
  );
}

beforeEach(() => {
  vi.stubGlobal("location", { pathname: "/orders", search: "?status=pending", assign });
});

afterEach(() => {
  assign.mockReset();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("httpClient", () => {
  it("sends requests to the API and rejects failures as ApiError", async () => {
    server.use(http.get("*/api/v1/admin/orders/", () => errorEnvelope(404, "not_found")));

    const request = httpClient.get("admin/orders/");

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 404, code: "not_found" });
  });

  it("repeats a key for each value of an array parameter, as DRF expects", async () => {
    let sentSearch = "";
    server.use(
      http.get("*/api/v1/admin/orders/", ({ request }) => {
        sentSearch = new URL(request.url).search;
        return HttpResponse.json({ count: 0 });
      }),
    );

    await httpClient.get("admin/orders/", { params: { status: ["pending", "confirmed"] } });

    expect(sentSearch).toBe("?status=pending&status=confirmed");
  });

  it("sends the stored access token, but not to the token endpoint", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    const sent: (string | null)[] = [];
    server.use(
      http.get("*/api/v1/admin/orders/", ({ request }) => {
        sent.push(request.headers.get("Authorization"));
        return HttpResponse.json({ count: 0 });
      }),
      http.post("*/api/v1/auth/token/", ({ request }) => {
        sent.push(request.headers.get("Authorization"));
        return HttpResponse.json({ access: "a2", refresh: "r2" });
      }),
    );

    await httpClient.get("admin/orders/");
    await httpClient.post("auth/token/", { email: "staff@truelux.test", password: "secret" });

    expect(sent).toEqual(["Bearer a1", null]);
  });

  it("refreshes once for concurrent 401s, stores the rotated pair and retries each", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    const refreshBodies: unknown[] = [];
    server.use(
      ordersAcceptingOnly("Bearer a2"),
      http.post("*/api/v1/auth/token/refresh/", async ({ request }) => {
        refreshBodies.push(await request.json());
        return HttpResponse.json({ access: "a2", refresh: "r2" });
      }),
    );

    const responses = await Promise.all([
      httpClient.get("admin/orders/"),
      httpClient.get("admin/orders/"),
      httpClient.get("admin/orders/"),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(refreshBodies).toEqual([{ refresh: "r1" }]);
    expect(readSession()).toEqual({ access: "a2", refresh: "r2" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("retries with a pair another tab stored instead of refreshing again", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    let refreshCount = 0;
    server.use(
      http.get("*/api/v1/admin/orders/", ({ request }) => {
        if (request.headers.get("Authorization") === "Bearer a2") {
          return HttpResponse.json({ count: 0 });
        }
        saveSession({ access: "a2", refresh: "r2" });
        return errorEnvelope(401, "authentication_failed");
      }),
      http.post("*/api/v1/auth/token/refresh/", () => {
        refreshCount += 1;
        return errorEnvelope(401, "authentication_failed");
      }),
    );

    const response = await httpClient.get("admin/orders/");

    expect(response.status).toBe(200);
    expect(refreshCount).toBe(0);
  });

  it("clears the session and sends the tab to sign-in when the refresh is refused", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    server.use(
      ordersAcceptingOnly("Bearer a2"),
      http.post("*/api/v1/auth/token/refresh/", () => errorEnvelope(401, "authentication_failed")),
    );

    const request = httpClient.get("admin/orders/");

    await expect(request).rejects.toMatchObject({ status: 401, code: "authentication_failed" });
    expect(readSession()).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login?expired=1&next=%2Forders%3Fstatus%3Dpending");
  });

  it("ends the session on a 403 without refreshing", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    server.use(http.get("*/api/v1/admin/orders/", () => errorEnvelope(403, "permission_denied")));

    const request = httpClient.get("admin/orders/");

    await expect(request).rejects.toMatchObject({ status: 403 });
    expect(readSession()).toBeNull();
    expect(assign).toHaveBeenCalledOnce();
  });

  it("keeps the session when the refresh cannot reach the API", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    server.use(
      ordersAcceptingOnly("Bearer a2"),
      http.post("*/api/v1/auth/token/refresh/", () => HttpResponse.error()),
    );

    const request = httpClient.get("admin/orders/");

    await expect(request).rejects.toMatchObject({ code: "network_error" });
    expect(readSession()).toEqual({ access: "a1", refresh: "r1" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("neither refreshes nor redirects when sign-in is refused", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    server.use(
      http.post("*/api/v1/auth/token/", () => errorEnvelope(401, "authentication_failed")),
    );

    const request = httpClient.post("auth/token/", { email: "x@truelux.test", password: "bad" });

    await expect(request).rejects.toMatchObject({ status: 401, code: "authentication_failed" });
    expect(assign).not.toHaveBeenCalled();
  });
});
