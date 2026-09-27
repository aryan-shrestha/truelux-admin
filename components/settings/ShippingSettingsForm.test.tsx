import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ShippingSettingsForm } from "@/components/settings/ShippingSettingsForm";
import type { ShippingSettings } from "@/lib/api/types";
import { saveShippingSettings } from "@/lib/settings/actions";
import { settingsKeys, shippingSettingsQuery } from "@/lib/settings/queries";
import { renderWithQuery, testQueryClient } from "@/tests/fixtures/query";

vi.mock("@/lib/settings/actions", () => ({ saveShippingSettings: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const settings: ShippingSettings = {
  inside_valley_fee: "150.00",
  outside_valley_fee: "250.00",
  free_shipping_threshold: "8000.00",
  updated_at: "2026-09-27T08:00:00Z",
};

function renderForm(seed: ShippingSettings = settings) {
  const client = testQueryClient();
  client.setQueryData(shippingSettingsQuery.queryKey, seed);
  return renderWithQuery(<ShippingSettingsForm />, client);
}

beforeEach(() => {
  vi.mocked(saveShippingSettings).mockReset();
});

describe("ShippingSettingsForm", () => {
  it("turns free shipping off, hides the threshold and saves", async () => {
    vi.mocked(saveShippingSettings).mockResolvedValueOnce({
      ok: true,
      data: { ...settings, free_shipping_threshold: null },
    });
    const { client } = renderForm();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    expect(screen.getByLabelText("Free shipping threshold")).toHaveValue("8000.00");
    await userEvent.click(screen.getByRole("switch", { name: "Free shipping" }));
    expect(screen.queryByLabelText("Free shipping threshold")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(saveShippingSettings).toHaveBeenCalledWith(
      expect.objectContaining({ has_free_shipping: false }),
    );
    expect(toast.success).toHaveBeenCalledWith("Shipping settings saved");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: settingsKeys.shipping() });
  });

  it("requires a threshold when free shipping is turned on", async () => {
    renderForm({ ...settings, free_shipping_threshold: null });

    expect(screen.getByRole("switch", { name: "Free shipping" })).not.toBeChecked();
    await userEvent.click(screen.getByRole("switch", { name: "Free shipping" }));
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("Enter the order amount that ships free.")).toBeVisible();
    expect(screen.getByLabelText("Free shipping threshold")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(saveShippingSettings).not.toHaveBeenCalled();
  });

  it("puts the API's validation_error details on the matching field", async () => {
    vi.mocked(saveShippingSettings).mockResolvedValueOnce({
      ok: false,
      code: "validation_error",
      message: "Check the highlighted fields.",
      fieldErrors: { outside_valley_fee: "Ensure this value is greater than or equal to 0." },
      details: {},
    });
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(
      await screen.findByText("Ensure this value is greater than or equal to 0."),
    ).toBeVisible();
    expect(screen.getByLabelText("Outside the valley")).toHaveAttribute("aria-invalid", "true");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows a failure with no field as a form alert", async () => {
    vi.mocked(saveShippingSettings).mockResolvedValueOnce({
      ok: false,
      code: "throttled",
      message: "Too many requests. Wait a moment and try again.",
      fieldErrors: {},
      details: {},
    });
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");
  });
});
