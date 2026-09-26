import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SkinTypesTable } from "@/components/taxonomy/SkinTypesTable";
import { removeTaxonomy } from "@/lib/taxonomy/actions";

vi.mock("@/lib/taxonomy/actions", () => ({ removeTaxonomy: vi.fn(), saveSkinType: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const skinTypes = [
  { id: "st1", name: "Oily", slug: "oily", sort_order: 0, product_count: 4 },
  { id: "st2", name: "Mature", slug: "mature", sort_order: 1, product_count: 0 },
];

describe("SkinTypesTable", () => {
  it("warns that deleting detaches the skin type from its products", async () => {
    vi.mocked(removeTaxonomy).mockResolvedValueOnce({ ok: true, data: null });
    render(<SkinTypesTable skinTypes={skinTypes} query="" />);

    await userEvent.click(screen.getByRole("button", { name: "Actions for Oily" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      "It will be removed from the 4 products that list it.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(removeTaxonomy).toHaveBeenCalledWith("skin-types", "st1");
  });

  it("says only that it cannot be undone when no product uses it", async () => {
    render(<SkinTypesTable skinTypes={skinTypes} query="" />);

    await userEvent.click(screen.getByRole("button", { name: "Actions for Mature" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("This cannot be undone.");
    expect(dialog).not.toHaveTextContent("removed from");
  });
});
