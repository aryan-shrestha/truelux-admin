import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveShippingSettings } from "@/lib/settings/actions";
import { errorResponse, jsonResponse } from "@/tests/fixtures/http";
import { cookieJar } from "@/tests/fixtures/next-server";

vi.mock("next/headers", async () => (await import("@/tests/fixtures/next-server")).headersModule);
vi.mock(
  "next/navigation",
  async () => (await import("@/tests/fixtures/next-server")).navigationModule,
);

const fetchMock = vi.fn<typeof fetch>();

const saved = {
  inside_valley_fee: "150.00",
  outside_valley_fee: "250.00",
  free_shipping_threshold: null,
  updated_at: "2026-09-27T08:00:00Z",
};

beforeEach(() => {
  cookieJar.reset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function sentBody(): unknown {
  const init = fetchMock.mock.calls[0]?.[1];
  return JSON.parse(String(init?.body));
}

describe("saveShippingSettings", () => {
  it("sends a null threshold when free shipping is off, whatever the field holds", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(saved));

    const result = await saveShippingSettings({
      inside_valley_fee: "150.00",
      outside_valley_fee: "250.00",
      has_free_shipping: false,
      free_shipping_threshold: "8000",
    });

    expect(result).toMatchObject({ ok: true, data: saved });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toMatch(/\/api\/v1\/admin\/settings\/shipping\/$/);
    expect(init?.method).toBe("PATCH");
    expect(sentBody()).toEqual({
      inside_valley_fee: "150.00",
      outside_valley_fee: "250.00",
      free_shipping_threshold: null,
    });
  });

  it("sends the threshold as a string when free shipping is on", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...saved, free_shipping_threshold: "8000.00" }));

    await saveShippingSettings({
      inside_valley_fee: "150",
      outside_valley_fee: "250",
      has_free_shipping: true,
      free_shipping_threshold: " 8000 ",
    });

    expect(sentBody()).toMatchObject({ free_shipping_threshold: "8000" });
  });

  it("refuses invalid input without calling the API", async () => {
    const result = await saveShippingSettings({
      inside_valley_fee: "-1",
      outside_valley_fee: "250",
      has_free_shipping: false,
      free_shipping_threshold: "",
    });

    expect(result).toMatchObject({ ok: false, code: "validation_error" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the API's validation errors on by field", async () => {
    fetchMock.mockResolvedValueOnce(
      errorResponse(400, "validation_error", { free_shipping_threshold: ["Too small."] }),
    );

    const result = await saveShippingSettings({
      inside_valley_fee: "150",
      outside_valley_fee: "250",
      has_free_shipping: true,
      free_shipping_threshold: "1",
    });

    expect(result).toMatchObject({
      ok: false,
      code: "validation_error",
      fieldErrors: { free_shipping_threshold: "Too small." },
    });
  });
});
