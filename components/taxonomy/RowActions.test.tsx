import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { RowActions } from "@/components/taxonomy/RowActions";
import { removeTaxonomy } from "@/lib/taxonomy/actions";
import { renderWithQuery } from "@/tests/fixtures/query";

vi.mock("@/lib/taxonomy/actions", () => ({ removeTaxonomy: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("RowActions", () => {
  it("explains a 409 on delete with the usage count instead of the API message", async () => {
    vi.mocked(removeTaxonomy).mockResolvedValueOnce({
      ok: false,
      code: "conflict",
      message: "This duplicates an existing record.",
      fieldErrors: {},
      details: {},
    });
    renderWithQuery(
      <RowActions
        kind="brands"
        id="b1"
        name="Lumière"
        inUseMessage="In use by 6 products. Deactivate or reassign first."
        editDialog={() => null}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Actions for Lumière" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    expect(removeTaxonomy).toHaveBeenCalledWith("brands", "b1");
    expect(toast.error).toHaveBeenCalledWith("In use by 6 products. Deactivate or reassign first.");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
