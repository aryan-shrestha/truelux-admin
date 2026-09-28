import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { signIn, signOut } from "@/lib/auth/actions";
import { errorResponse, jsonResponse, sentRequest } from "@/tests/fixtures/http";
import { fakeJwt } from "@/tests/fixtures/jwt";
import { cookieJar } from "@/tests/fixtures/next-server";

vi.mock("next/headers", async () => (await import("@/tests/fixtures/next-server")).headersModule);
vi.mock(
  "next/navigation",
  async () => (await import("@/tests/fixtures/next-server")).navigationModule,
);

const fetchMock = vi.fn<typeof fetch>();
const credentials = { email: "staff@truelux.com", password: "correct horse" };

beforeEach(() => {
  cookieJar.reset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("signIn", () => {
  it("stores both tokens in httpOnly cookies sized to each token's expiry", async () => {
    const pair = { access: fakeJwt(300), refresh: fakeJwt(86_400) };
    fetchMock.mockResolvedValueOnce(jsonResponse(pair));

    await expect(signIn(credentials, "/orders?status=pending")).rejects.toMatchObject({
      url: "/orders?status=pending",
    });

    const [access, refresh] = cookieJar.sets;
    expect(access).toMatchObject({ name: "tl_access", value: pair.access });
    expect(refresh).toMatchObject({ name: "tl_refresh", value: pair.refresh });
    for (const set of cookieJar.sets) {
      expect(set.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    }
    expect(access?.options?.maxAge).toBeGreaterThan(295);
    expect(access?.options?.maxAge).toBeLessThanOrEqual(300);
    expect(refresh?.options?.maxAge).toBeGreaterThan(86_000);
  });

  it("ignores an off-site next and lands on the dashboard", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ access: fakeJwt(300), refresh: fakeJwt(900) }));

    await expect(signIn(credentials, "//evil.com")).rejects.toMatchObject({ url: "/" });
  });

  it("reports a rejected login without naming the field that was wrong", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(401, "authentication_failed"));

    const failure = await signIn(credentials, null);

    expect(failure).toMatchObject({ ok: false, code: "authentication_failed", fieldErrors: {} });
    expect(failure.message).toBe("Email or password is incorrect.");
    expect(cookieJar.sets).toHaveLength(0);
  });

  it("surfaces throttling as its own message", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(429, "throttled"));

    const failure = await signIn(credentials, null);

    expect(failure.code).toBe("throttled");
    expect(failure.message).toMatch(/too many/i);
  });

  it("does not call the API for input that fails the schema", async () => {
    const failure = await signIn({ email: "not-an-email", password: "" }, null);

    expect(failure.code).toBe("validation_error");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("blacklists the refresh token, clears both cookies and redirects to login", async () => {
    cookieJar.reset({ tl_access: fakeJwt(300), tl_refresh: "the-refresh" });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(signOut()).rejects.toMatchObject({ url: "/login" });

    const sent = sentRequest(fetchMock);
    expect(sent.url).toBe("http://api.test/api/v1/auth/logout/");
    expect(await sent.json()).toEqual({ refresh: "the-refresh" });
    expect(cookieJar.values.size).toBe(0);
  });

  it("still clears the cookies when the API rejects the refresh token with a 422", async () => {
    cookieJar.reset({ tl_access: fakeJwt(300), tl_refresh: "revoked" });
    fetchMock.mockResolvedValueOnce(errorResponse(422, "invalid_refresh_token"));

    await expect(signOut()).rejects.toMatchObject({ url: "/login" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cookieJar.values.size).toBe(0);
  });

  it("still clears the cookies when the API is unreachable", async () => {
    cookieJar.reset({ tl_access: fakeJwt(300), tl_refresh: "the-refresh" });
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(signOut()).rejects.toMatchObject({ url: "/login" });
    expect(cookieJar.values.size).toBe(0);
  });
});
