import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { chooseRowAction } from "@/test/row-menu";
import { meHandler } from "@/test/staff";

const SKIN_TYPES_PATH = "*/api/v1/admin/skin-types/";
const OILY = {
  id: "0b000000-0000-4000-8000-000000000001",
  name: "Oily",
  slug: "oily",
  sort_order: 0,
  product_count: 4,
};
const DRY = {
  id: "0b000000-0000-4000-8000-000000000002",
  name: "Dry",
  slug: "dry",
  sort_order: 1,
  product_count: 0,
};

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
});

afterEach(() => localStorage.clear());

async function askToDelete(name: string) {
  const user = userEvent.setup();
  await chooseRowAction(user, name, "Delete");
  return { user, dialog: await screen.findByRole("alertdialog") };
}

describe("skin types", () => {
  it("says how many products lose a skin type before deleting it", async () => {
    server.use(
      meHandler,
      http.get(SKIN_TYPES_PATH, () => HttpResponse.json([OILY, DRY])),
    );
    renderApp("/skin-types");

    const { dialog } = await askToDelete("Oily");

    expect(dialog).toHaveTextContent("Removes it from 4 products. This cannot be undone.");
  });

  it("says only that it cannot be undone when no product uses it", async () => {
    server.use(
      meHandler,
      http.get(SKIN_TYPES_PATH, () => HttpResponse.json([OILY, DRY])),
    );
    renderApp("/skin-types");

    const { dialog } = await askToDelete("Dry");

    expect(within(dialog).getByText("This cannot be undone.")).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent("Removes it from");
  });

  it("deletes after the confirmation and shows the refetched list", async () => {
    let isDeleted = false;
    server.use(
      meHandler,
      http.get(SKIN_TYPES_PATH, () => HttpResponse.json(isDeleted ? [DRY] : [OILY, DRY])),
      http.delete(`${SKIN_TYPES_PATH}${OILY.id}/`, () => {
        isDeleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp("/skin-types");
    const { user, dialog } = await askToDelete("Oily");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Oily deleted")).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(screen.queryByRole("cell", { name: "Oily" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("cell", { name: "Dry" })).toBeInTheDocument();
  });
});
