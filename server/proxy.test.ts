import { createApp } from "./app.ts";
import { ACCESS_COOKIE } from "./session.ts";

const API_URL = "http://api.test";

function upstreamRequest(fetchMock: ReturnType<typeof vi.fn>): Request {
  const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
  return new Request(url, init);
}

describe("BFF proxy", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({ count: 0 }, { headers: { "x-request-id": "req-1", "set-cookie": "a=b" } }),
      );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards an admin call with the access cookie as a bearer token", async () => {
    const app = createApp({ apiUrl: API_URL });

    const response = await app.request("/bff/api/admin/orders/?limit=25", {
      headers: { cookie: `${ACCESS_COOKIE}=jwt-access; other=1`, accept: "application/json" },
    });

    const upstream = upstreamRequest(fetchMock);
    expect(upstream.url).toBe("http://api.test/api/v1/admin/orders/?limit=25");
    expect(upstream.headers.get("authorization")).toBe("Bearer jwt-access");
    expect(upstream.headers.get("cookie")).toBeNull();
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req-1");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("forwards the request body of a write", async () => {
    const app = createApp({ apiUrl: API_URL });

    await app.request("/bff/api/admin/brands/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Lakmé" }),
    });

    const upstream = upstreamRequest(fetchMock);
    expect(upstream.method).toBe("POST");
    expect(await upstream.json()).toEqual({ name: "Lakmé" });
  });

  it.each([
    "/bff/api/auth/token/",
    "/bff/api/auth/token/refresh/",
    "/bff/api/admin/../auth/token/",
    "/bff/api/admin/%2e%2e/auth/token/",
    "/bff/api/products/",
  ])("refuses %s with a 404 envelope and never calls the API", async (path) => {
    const app = createApp({ apiUrl: API_URL });

    const response = await app.request(path, { method: "POST" });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "not_found", message: "Not found.", details: {} },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a 502 envelope when the API cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const app = createApp({ apiUrl: API_URL });

    const response = await app.request("/bff/api/admin/orders/");

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: { code: "bad_gateway" } });
  });
});
