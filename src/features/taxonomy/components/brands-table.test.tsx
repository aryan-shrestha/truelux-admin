import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

const BRANDS_PATH = "*/api/v1/admin/brands/";

function brand(name: string, overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    name,
    slug: name.toLowerCase(),
    description: "",
    logo_url: null,
    is_active: true,
    sort_order: 0,
    product_count: 3,
    ...overrides,
  };
}

function errorEnvelope(status: number, code: string, details: Record<string, unknown> = {}) {
  return HttpResponse.json({ error: { code, message: code, details } }, { status });
}

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler);
});

afterEach(() => localStorage.clear());

async function openNewBrand() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "New brand" }));
  return { user, dialog: await screen.findByRole("dialog") };
}

describe("brands", () => {
  it("lists every brand with its status", async () => {
    server.use(
      http.get(BRANDS_PATH, () =>
        HttpResponse.json([brand("Lumière"), brand("Maison", { is_active: false })]),
      ),
    );

    renderApp("/brands");

    const row = (await screen.findByText("Maison")).closest("tr") as HTMLElement;
    expect(within(row).getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("searches the loaded list without asking the API again", async () => {
    const user = userEvent.setup();
    let listRequests = 0;
    server.use(
      http.get(BRANDS_PATH, () => {
        listRequests += 1;
        return HttpResponse.json([brand("Lumière"), brand("Maison")]);
      }),
    );
    renderApp("/brands");
    await screen.findByText("Maison");

    await user.type(screen.getByRole("searchbox"), "lumi");

    await vi.waitFor(() => expect(screen.queryByText("Maison")).not.toBeInTheDocument());
    expect(screen.getByText("Lumière")).toBeInTheDocument();
    expect(listRequests).toBe(1);
  });

  it("creates a brand as JSON, without a blank slug, and shows it", async () => {
    let sentBody: unknown;
    let created = false;
    server.use(
      http.get(BRANDS_PATH, () => HttpResponse.json(created ? [brand("Lumière")] : [])),
      http.post(BRANDS_PATH, async ({ request }) => {
        sentBody = await request.json();
        created = true;
        return HttpResponse.json(brand("Lumière"), { status: 201 });
      }),
    );
    renderApp("/brands");
    const { user, dialog } = await openNewBrand();

    await user.type(within(dialog).getByLabelText("Name"), "Lumière");
    await user.click(within(dialog).getByRole("button", { name: "Create brand" }));

    expect(await screen.findByText("Brand created")).toBeInTheDocument();
    expect(await screen.findByRole("cell", { name: /Lumière/ })).toBeInTheDocument();
    expect(sentBody).toEqual({ name: "Lumière", description: "", is_active: true, sort_order: 0 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uploads a new logo as multipart form data", async () => {
    let contentType = "";
    let sentBody = "";
    server.use(
      http.get(BRANDS_PATH, () => HttpResponse.json([])),
      http.post(BRANDS_PATH, async ({ request }) => {
        contentType = request.headers.get("content-type") ?? "";
        // Read as text: Node's multipart parser rejects the body jsdom's FormData builds.
        sentBody = await request.text();
        return HttpResponse.json(brand("Lumière"), { status: 201 });
      }),
    );
    renderApp("/brands");
    const { user, dialog } = await openNewBrand();

    await user.type(within(dialog).getByLabelText("Name"), "Lumière");
    await user.upload(
      within(dialog).getByLabelText("Logo"),
      new File(["png"], "logo.png", { type: "image/png" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Create brand" }));

    await screen.findByText("Brand created");
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(sentBody).toContain('name="logo"; filename="logo.png"');
    expect(sentBody).toContain('name="name"');
  });

  it("puts the API's message under the field it names", async () => {
    server.use(
      http.get(BRANDS_PATH, () => HttpResponse.json([])),
      http.post(BRANDS_PATH, () =>
        errorEnvelope(400, "validation_error", {
          name: ["Ensure this field has no more than 150 characters."],
        }),
      ),
    );
    renderApp("/brands");
    const { user, dialog } = await openNewBrand();

    await user.type(within(dialog).getByLabelText("Name"), "Lumière");
    await user.click(within(dialog).getByRole("button", { name: "Create brand" }));

    expect(
      await within(dialog).findByText("Ensure this field has no more than 150 characters."),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
  });

  it("explains a duplicate name or slug above the form", async () => {
    server.use(
      http.get(BRANDS_PATH, () => HttpResponse.json([])),
      http.post(BRANDS_PATH, () => errorEnvelope(409, "conflict")),
    );
    renderApp("/brands");
    const { user, dialog } = await openNewBrand();

    await user.type(within(dialog).getByLabelText("Name"), "Lumière");
    await user.click(within(dialog).getByRole("button", { name: "Create brand" }));

    expect(
      await within(dialog).findByText(
        "This duplicates an existing record. Check the name and the slug.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps a brand in use and says why when the API refuses to delete it", async () => {
    const user = userEvent.setup();
    const lumiere = brand("Lumière", { product_count: 7 });
    server.use(
      http.get(BRANDS_PATH, () => HttpResponse.json([lumiere])),
      http.delete(`${BRANDS_PATH}${lumiere.id}/`, () => errorEnvelope(409, "conflict")),
    );
    renderApp("/brands");

    await user.click(await screen.findByRole("button", { name: "Actions for Lumière" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    );

    expect(
      await screen.findByText("In use by 7 products. Deactivate or reassign them first."),
    ).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /Lumière/ })).toBeInTheDocument();
  });
});
