import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { VariantsEditor } from "@/components/products/VariantsEditor";
import { addVariant, removeVariant } from "@/lib/products/actions";
import { variant } from "@/tests/fixtures/products";
import { renderWithQuery } from "@/tests/fixtures/query";

vi.mock("@/lib/products/actions", () => ({
  addVariant: vi.fn(),
  saveVariant: vi.fn(),
  removeVariant: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const sizes = [{ value: "s30", label: "30 ml" }];
const shades = [{ id: "sh1", name: "Warm Beige", hex_code: "#D8A47F" }];

function rows() {
  return screen.getAllByRole("row").slice(1);
}

describe("VariantsEditor", () => {
  it("adds a draft row and discards it again", async () => {
    renderWithQuery(
      <VariantsEditor productId="p1" variants={[variant]} sizes={sizes} shades={shades} />,
    );
    expect(rows()).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: "Add variant" }));
    expect(rows()).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: "Discard this variant" }));
    expect(rows()).toHaveLength(1);
  });

  it("validates a draft before calling the server", async () => {
    renderWithQuery(<VariantsEditor productId="p1" variants={[]} sizes={sizes} shades={shades} />);

    await userEvent.click(screen.getByRole("button", { name: "Add this variant" }));

    expect(await screen.findByText("Enter a SKU.")).toBeInTheDocument();
    expect(await screen.findByText("Choose a size.")).toBeInTheDocument();
    expect(addVariant).not.toHaveBeenCalled();
  });

  it("asks before deleting a saved variant, then calls the server", async () => {
    vi.mocked(removeVariant).mockResolvedValueOnce({ ok: true, data: null });
    renderWithQuery(
      <VariantsEditor productId="p1" variants={[variant]} sizes={sizes} shades={shades} />,
    );

    await userEvent.click(screen.getByRole("button", { name: `Delete ${variant.sku}` }));
    const dialog = await screen.findByRole("alertdialog");
    expect(removeVariant).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "Delete variant" }));
    expect(removeVariant).toHaveBeenCalledWith(variant.id);
  });
});
