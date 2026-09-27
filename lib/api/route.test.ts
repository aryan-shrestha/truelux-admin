import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, ApiUnreachableError } from "@/lib/api/errors";
import { respond } from "@/lib/api/route";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("respond", () => {
  it("returns the data as private, uncached JSON", async () => {
    const response = await respond(async () => ({ id: "o1" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ id: "o1" });
  });

  it("passes an API error on in the API's own envelope", async () => {
    const response = await respond(async () => {
      throw new ApiError("not_found", 404, { id: ["gone"] }, "req-9", "Not found.");
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("X-Request-ID")).toBe("req-9");
    const body = await response.json();
    expect(body.error.code).toBe("not_found");
    expect(body.error.details).toEqual({ id: ["gone"] });
  });

  it("turns an unreachable API into a 502 with its own code", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await respond(async () => {
      throw new ApiUnreachableError(new TypeError("fetch failed"));
    });

    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("api_unreachable");
  });

  it("rethrows anything that is not an API failure", async () => {
    await expect(
      respond(async () => {
        throw new RangeError("bug");
      }),
    ).rejects.toThrow(RangeError);
  });
});
