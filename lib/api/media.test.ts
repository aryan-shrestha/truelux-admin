import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getProduct, listProducts } from "@/lib/api/products";
import { listTaxonomy } from "@/lib/api/taxonomy";
import { jsonResponse } from "@/tests/fixtures/http";
import { cookieJar } from "@/tests/fixtures/next-server";
import { image, product } from "@/tests/fixtures/products";

vi.mock("next/headers", async () => (await import("@/tests/fixtures/next-server")).headersModule);
vi.mock(
  "next/navigation",
  async () => (await import("@/tests/fixtures/next-server")).navigationModule,
);

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  cookieJar.reset({ tl_access: "access", tl_refresh: "refresh" });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("media URLs", () => {
  it("resolves a local /media/ path against the API origin and keeps a Cloudinary URL", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        ...product,
        images: [{ ...image("i1", 0, true), url: "/media/products/serum.png" }, image("i2", 1)],
      }),
    );

    const { images } = await getProduct({ id: "p1" });

    expect(images.map((item) => item.url)).toEqual([
      "http://api.test/media/products/serum.png",
      "https://res.cloudinary.com/demo/i2.jpg",
    ]);
  });

  it("resolves list thumbnails and leaves a missing one null", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        count: 2,
        next: null,
        previous: null,
        results: [
          { id: "p1", primary_image_url: "/media/products/a.png" },
          { id: "p2", primary_image_url: null },
        ],
      }),
    );

    const page = await listProducts({ limit: 25, offset: 0 });

    expect(page.results.map((item) => item.primary_image_url)).toEqual([
      "http://api.test/media/products/a.png",
      null,
    ]);
  });

  it("resolves brand logos", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        { id: "b1", logo_url: "/media/brands/lumiere.png" },
        { id: "b2", logo_url: null },
      ]),
    );

    const brands = await listTaxonomy("brands");

    expect(brands.map((brand) => brand.logo_url)).toEqual([
      "http://api.test/media/brands/lumiere.png",
      null,
    ]);
  });
});
