import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { BRAND, CATEGORY, catalogueHandlers } from "@/test/catalogue";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

const PRODUCT_ID = "0d000000-0000-4000-8000-000000000001";
const PRODUCT_PATH = `*/api/v1/admin/products/${PRODUCT_ID}/`;

function image(n: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `0f000000-0000-4000-8000-00000000000${n}`,
    url: `https://cdn.test/${n}.jpg`,
    alt_text: `Photo ${n}`,
    sort_order: 0,
    is_primary: false,
    ...overrides,
  };
}

function product(images: unknown[]) {
  return {
    id: PRODUCT_ID,
    name: "Silk Foundation",
    slug: "silk-foundation",
    description: "",
    brand: { id: BRAND.id, name: BRAND.name, slug: BRAND.slug },
    category: { id: CATEGORY.id, name: CATEGORY.name, slug: CATEGORY.slug },
    base_price: "3200.00",
    is_published: false,
    sort_order: 0,
    skin_types: [],
    skin_feel: "",
    key_ingredients: "",
    variants: [],
    images,
    created_at: "2026-09-01T09:00:00Z",
    updated_at: "2026-09-01T09:00:00Z",
  };
}

function imageAlts() {
  return screen.getAllByRole("img").map((element) => element.getAttribute("alt"));
}

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler, ...catalogueHandlers);
});

afterEach(() => localStorage.clear());

describe("product images", () => {
  it("uploads files one at a time, the first becoming primary when there is none", async () => {
    const user = userEvent.setup();
    const bodies: string[] = [];
    let uploaded: unknown[] = [];
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product(uploaded))),
      http.post(`${PRODUCT_PATH}images/`, async ({ request }) => {
        bodies.push(await request.text());
        const created = image(bodies.length, { is_primary: bodies.length === 1, alt_text: "" });
        uploaded = [...uploaded, created];
        return HttpResponse.json(created, { status: 201 });
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=images`);

    await user.upload(await screen.findByLabelText("Upload images"), [
      new File(["a"], "front.jpg", { type: "image/jpeg" }),
      new File(["b"], "back.png", { type: "image/png" }),
    ]);

    expect(await screen.findByText("2 images uploaded")).toBeInTheDocument();
    expect(bodies).toHaveLength(2);
    // Read as text: Node's multipart parser rejects the body jsdom's FormData builds.
    expect(bodies[0]).toMatch(/name="is_primary"\r\n\r\ntrue/);
    expect(bodies[1]).toMatch(/name="is_primary"\r\n\r\nfalse/);
    expect(bodies[0]).toContain('filename="front.jpg"');
    // Uploaded without alt text, so the images are decorative (`alt=""`), not `img`s.
    expect(await screen.findAllByLabelText(/^Alt text of image/)).toHaveLength(2);
  });

  it("refuses a file the API would reject without sending it", async () => {
    const user = userEvent.setup({ applyAccept: false });
    let uploads = 0;
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product([]))),
      http.post(`${PRODUCT_PATH}images/`, () => {
        uploads += 1;
        return HttpResponse.json(image(1), { status: 201 });
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=images`);

    await user.upload(
      await screen.findByLabelText("Upload images"),
      new File(["gif"], "spinner.gif", { type: "image/gif" }),
    );

    expect(
      await screen.findByText("spinner.gif: Use a JPEG, PNG or WebP image."),
    ).toBeInTheDocument();
    expect(uploads).toBe(0);
  });

  it("shows new alt text at once and puts it back when the API refuses", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product([image(1)]))),
      http.patch(`*/api/v1/admin/images/${image(1).id}/`, async () => {
        await delay(100);
        return HttpResponse.json(
          { error: { code: "throttled", message: "throttled", details: {} } },
          { status: 429 },
        );
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=images`);
    const field = await screen.findByLabelText("Alt text of image 1");

    await user.clear(field);
    await user.type(field, "Front of the bottle");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("img", { name: "Front of the bottle" })).toBeInTheDocument();
    expect(
      await screen.findByText("Too many requests. Wait a moment and try again."),
    ).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "Photo 1" })).toBeInTheDocument();
  });

  it("moves an image at once and renumbers only the images whose order changed", async () => {
    const user = userEvent.setup();
    const sent: [string, unknown][] = [];
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product([image(1), image(2), image(3)]))),
      http.patch("*/api/v1/admin/images/:id/", async ({ request, params }) => {
        await delay(50);
        sent.push([String(params.id), await request.json()]);
        return HttpResponse.json(image(1));
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=images`);
    await screen.findAllByRole("img");

    await user.click(screen.getByRole("button", { name: "Move image 1 later" }));

    expect(imageAlts()).toEqual(["Photo 2", "Photo 1", "Photo 3"]);
    await vi.waitFor(() =>
      expect(sent).toEqual([
        [image(1).id, { sort_order: 1 }],
        [image(3).id, { sort_order: 2 }],
      ]),
    );
  });

  it("makes another image primary once the API has answered", async () => {
    const user = userEvent.setup();
    let isSwapped = false;
    let sentBody: unknown;
    server.use(
      http.get(PRODUCT_PATH, () =>
        HttpResponse.json(
          product([
            image(1, { is_primary: !isSwapped }),
            image(2, { sort_order: 1, is_primary: isSwapped }),
          ]),
        ),
      ),
      http.patch(`*/api/v1/admin/images/${image(2).id}/`, async ({ request }) => {
        sentBody = await request.json();
        isSwapped = true;
        return HttpResponse.json(image(2, { is_primary: true }));
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=images`);

    await user.click(await screen.findByRole("button", { name: "Make image 2 primary" }));

    expect(await screen.findByText("Primary image changed")).toBeInTheDocument();
    expect(sentBody).toEqual({ is_primary: true });
    expect(await screen.findByRole("button", { name: "Make image 1 primary" })).toBeInTheDocument();
  });

  it("deletes an image only after the confirmation", async () => {
    const user = userEvent.setup();
    let isDeleted = false;
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product(isDeleted ? [] : [image(1)]))),
      http.delete(`*/api/v1/admin/images/${image(1).id}/`, () => {
        isDeleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=images`);

    await user.click(await screen.findByRole("button", { name: "Delete image 1" }));
    expect(isDeleted).toBe(false);
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    );

    expect(await screen.findByText("No images yet")).toBeInTheDocument();
  });
});
