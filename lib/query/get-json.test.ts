import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import { getJson } from "@/lib/query/get-json";
import { errorResponse, jsonResponse, sentPath } from "@/tests/fixtures/http";

const fetchMock = vi.fn<typeof fetch>();
const assign = vi.fn();

function calledPaths(): string[] {
  return fetchMock.mock.calls.map((_, call) => sentPath(fetchMock, call));
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("location", {
    origin: "http://admin.test",
    pathname: "/orders",
    search: "?status=pending",
    assign,
  });
});

afterEach(() => {
  fetchMock.mockReset();
  assign.mockReset();
  vi.unstubAllGlobals();
});

describe("getJson", () => {
  it("drops empty values and repeats array keys", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ count: 0 }));

    await getJson("/api/orders", { status: ["pending", "confirmed"], search: "", page: 2 });

    expect(calledPaths()).toEqual(["/api/orders?status=pending&status=confirmed&page=2"]);
  });

  it("refreshes once for concurrent requests, then retries each", async () => {
    fetchMock.mockImplementation(async (input) => {
      const isSession = (called: unknown) =>
        called instanceof Request && new URL(called.url).pathname === "/api/session";
      if (isSession(input)) return new Response(null, { status: 204 });
      const refreshed = fetchMock.mock.calls.some(([called]) => isSession(called));
      return refreshed
        ? jsonResponse({ ok: true })
        : errorResponse(401, "session_refresh_required");
    });

    await Promise.all([
      getJson("/api/orders"),
      getJson("/api/dashboard"),
      getJson("/api/products"),
    ]);

    expect(calledPaths().filter((path) => path === "/api/session")).toHaveLength(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it("sends the tab to an expired sign-in when the refresh is refused", async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(401, "session_refresh_required"))
      .mockResolvedValueOnce(errorResponse(401, "authentication_failed"));

    const failure = getJson("/api/orders");

    await expect(failure).rejects.toMatchObject({ code: "session_refresh_required" });
    const target = new URL(String(assign.mock.calls[0]?.[0]), "http://admin.test");
    expect(target.pathname).toBe("/login");
    expect(target.searchParams.get("expired")).toBe("1");
    expect(target.searchParams.get("next")).toBe("/orders?status=pending");
  });

  it("sends a de-staffed account to an expired sign-in", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(403, "permission_denied"));

    await expect(getJson("/api/orders")).rejects.toMatchObject({ code: "permission_denied" });
    expect(assign).toHaveBeenCalledOnce();
  });

  it("throws other API errors with their code and leaves the session alone", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(404, "not_found"));

    const error = await getJson("/api/orders/o1").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "not_found", requestId: "req-123" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("reports a failed connection as unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));

    await expect(getJson("/api/orders")).rejects.toBeInstanceOf(ApiUnreachableError);
  });

  it("lets a cancelled query reject as a cancel, not as an unreachable API", async () => {
    const controller = new AbortController();
    controller.abort();

    const error = await getJson("/api/orders", undefined, controller.signal).catch(
      (caught: unknown) => caught,
    );

    expect(axios.isCancel(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ApiUnreachableError);
  });
});
