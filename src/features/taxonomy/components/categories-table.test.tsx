import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

const CATEGORIES_PATH = "*/api/v1/admin/categories/";
const FACE = "0a000000-0000-4000-8000-000000000001";
const LIPS = "0a000000-0000-4000-8000-000000000002";

function category(id: string, name: string, parent_id: string | null, sort_order = 0) {
  return { id, name, slug: name.toLowerCase(), parent_id, sort_order, product_count: 0 };
}

const CATEGORIES = [
  category(LIPS, "Lips", null, 2),
  category("0a000000-0000-4000-8000-000000000003", "Gloss", LIPS),
  category(FACE, "Face", null, 1),
];

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(
    meHandler,
    http.get(CATEGORIES_PATH, () => HttpResponse.json(CATEGORIES)),
  );
});

afterEach(() => localStorage.clear());

async function editFace() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Actions for Face" }));
  await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
  return { user, dialog: await screen.findByRole("dialog") };
}

describe("categories", () => {
  it("lists each top-level category followed by its children", async () => {
    renderApp("/categories");

    await screen.findByText("Gloss");
    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0]?.textContent);
    expect(names).toEqual(["Face", "Lips", "Gloss"]);
    const glossRow = screen.getByText("Gloss").closest("tr") as HTMLElement;
    expect(within(glossRow).getByText("Lips")).toBeInTheDocument();
  });

  it("offers only other top-level categories as a parent", async () => {
    renderApp("/categories");
    const { user, dialog } = await editFace();

    await user.click(within(dialog).getByLabelText("Parent"));

    const options = (await screen.findAllByRole("option")).map((option) => option.textContent);
    expect(options).toEqual(["None (top level)", "Lips"]);
  });

  it("shows the API's cycle error under Parent", async () => {
    server.use(
      http.patch(`${CATEGORIES_PATH}${FACE}/`, () =>
        HttpResponse.json(
          {
            error: {
              code: "validation_error",
              message: "A category cannot be its own ancestor.",
              details: { parent_id: ["A category cannot be its own ancestor."] },
            },
          },
          { status: 400 },
        ),
      ),
    );
    renderApp("/categories");
    const { user, dialog } = await editFace();

    await user.click(within(dialog).getByRole("button", { name: "Save category" }));

    expect(
      await within(dialog).findByText("A category cannot be its own ancestor."),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Parent")).toHaveAttribute("aria-invalid", "true");
  });
});
