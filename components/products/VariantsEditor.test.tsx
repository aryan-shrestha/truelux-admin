import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { VariantsEditor } from "@/components/products/VariantsEditor";
import { addVariant, removeVariant, saveVariant } from "@/lib/products/actions";
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

  it("shows a variant's saved compare-at price", () => {
    renderWithQuery(
      <VariantsEditor
        productId="p1"
        variants={[{ ...variant, compare_at_price: "3800.00" }]}
        sizes={sizes}
        shades={shades}
      />,
    );

    expect(screen.getByLabelText(`Compare-at price of ${variant.sku}`)).toHaveValue("3800.00");
  });

  it("puts the API's compare-at error on that variant's cell", async () => {
    const other = { ...variant, id: "v2", sku: "LUM-SF-50-WB" };
    vi.mocked(saveVariant).mockResolvedValueOnce({
      ok: false,
      code: "validation_error",
      message: "Some fields are invalid.",
      fieldErrors: { compare_at_price: "Must be greater than the price." },
      details: { compare_at_price: ["Must be greater than the price."] },
    });
    renderWithQuery(
      <VariantsEditor productId="p1" variants={[variant, other]} sizes={sizes} shades={shades} />,
    );

    const input = screen.getByLabelText(`Compare-at price of ${other.sku}`);
    await userEvent.type(input, "3000");
    await userEvent.click(screen.getByRole("button", { name: `Save ${other.sku}` }));

    expect(saveVariant).toHaveBeenCalledWith(
      other.id,
      expect.objectContaining({ compare_at_price: "3000" }),
    );
    const [first, second] = rows();
    expect(await within(second!).findByText("Must be greater than the price.")).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(within(first!).queryByText("Must be greater than the price.")).not.toBeInTheDocument();
    expect(screen.queryByText("Some fields are invalid.")).not.toBeInTheDocument();
  });
});
