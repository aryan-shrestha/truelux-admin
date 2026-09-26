import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductDetailsForm } from "@/components/products/ProductDetailsForm";
import { updateProductAction } from "@/lib/products/actions";
import { product } from "@/tests/fixtures/products";

vi.mock("@/lib/products/actions", () => ({
  createProductAction: vi.fn(),
  updateProductAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const skinTypes = [
  { value: "st-dry", label: "Dry" },
  { value: "st-oily", label: "Oily" },
  { value: "st-sensitive", label: "Sensitive" },
];

function renderForm() {
  render(
    <ProductDetailsForm
      product={product}
      brands={[{ value: "b1", label: "Lumière" }]}
      categories={[{ value: "c1", label: "Face" }]}
      skinTypes={skinTypes}
    />,
  );
}

describe("ProductDetailsForm skin types", () => {
  it("shows the product's skin types as badges and toggles them from the list", async () => {
    vi.mocked(updateProductAction).mockResolvedValueOnce({ ok: true, data: product });
    renderForm();

    const trigger = screen.getByRole("combobox", { name: "Skin types" });
    expect(within(trigger).getByText("Dry")).toBeInTheDocument();

    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("option", { name: "Oily" }));
    await userEvent.click(screen.getByRole("option", { name: "Dry" }));
    expect(
      within(screen.getByRole("option", { name: "Oily" })).getByRole("checkbox"),
    ).toBeChecked();
    await userEvent.keyboard("{Escape}");

    expect(within(trigger).queryByText("Dry")).not.toBeInTheDocument();
    expect(within(trigger).getByText("Oily")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Skin feel"), "Soothed, balanced");
    await userEvent.type(screen.getByLabelText("Key ingredients"), "Niacinamide");
    await userEvent.click(screen.getByRole("button", { name: "Save details" }));

    expect(updateProductAction).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        skin_type_ids: ["st-oily"],
        skin_feel: "Soothed, balanced",
        key_ingredients: "Niacinamide",
      }),
    );
  });

  it("filters the list by name", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("combobox", { name: "Skin types" }));
    await userEvent.type(await screen.findByPlaceholderText("Search skin types"), "sens");

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Sensitive",
    ]);
  });
});
