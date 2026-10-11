import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

const SETTINGS_PATH = "*/api/v1/admin/settings/shipping/";

const SETTINGS = {
  inside_valley_fee: "150.00",
  outside_valley_fee: "250.00",
  free_shipping_threshold: "5000.00",
  updated_at: "2026-10-01T09:00:00Z",
};

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler);
});

afterEach(() => localStorage.clear());

describe("shipping settings", () => {
  it("starts from the API's settings", async () => {
    server.use(http.get(SETTINGS_PATH, () => HttpResponse.json(SETTINGS)));

    renderApp("/settings/shipping");

    expect(await screen.findByLabelText("Inside the valley")).toHaveValue("150.00");
    expect(screen.getByLabelText("Outside the valley")).toHaveValue("250.00");
    expect(screen.getByRole("switch", { name: "Free shipping" })).toBeChecked();
    expect(screen.getByLabelText("Free shipping from")).toHaveValue("5000.00");
    expect(screen.getByText(/^Last updated/)).toBeInTheDocument();
  });

  it("turns free shipping off by sending a null threshold", async () => {
    const user = userEvent.setup();
    let sentBody: unknown;
    server.use(
      http.get(SETTINGS_PATH, () => HttpResponse.json(SETTINGS)),
      http.patch(SETTINGS_PATH, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ ...SETTINGS, free_shipping_threshold: null });
      }),
    );
    renderApp("/settings/shipping");

    await user.click(await screen.findByRole("switch", { name: "Free shipping" }));
    expect(screen.queryByLabelText("Free shipping from")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("Shipping settings saved")).toBeInTheDocument();
    expect(sentBody).toEqual({
      inside_valley_fee: "150.00",
      outside_valley_fee: "250.00",
      free_shipping_threshold: null,
    });
    expect(screen.getByRole("switch", { name: "Free shipping" })).not.toBeChecked();
  });

  it("keeps the threshold typed when free shipping goes off and on again", async () => {
    const user = userEvent.setup();
    server.use(http.get(SETTINGS_PATH, () => HttpResponse.json(SETTINGS)));
    renderApp("/settings/shipping");
    const toggle = await screen.findByRole("switch", { name: "Free shipping" });

    await user.click(toggle);
    await user.click(toggle);

    expect(screen.getByLabelText("Free shipping from")).toHaveValue("5000.00");
  });

  it("asks for a threshold above 0 before sending anything", async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get(SETTINGS_PATH, () =>
        HttpResponse.json({ ...SETTINGS, free_shipping_threshold: null }),
      ),
      http.patch(SETTINGS_PATH, () => {
        requests += 1;
        return HttpResponse.json(SETTINGS);
      }),
    );
    renderApp("/settings/shipping");

    await user.click(await screen.findByRole("switch", { name: "Free shipping" }));
    await user.type(screen.getByLabelText("Free shipping from"), "0");
    await user.click(screen.getByRole("button", { name: "Save settings" }));

    expect(await screen.findByText("Enter an amount above 0, such as 5000.")).toBeInTheDocument();
    expect(requests).toBe(0);
  });

  it("puts the API's field message under the field", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(SETTINGS_PATH, () => HttpResponse.json(SETTINGS)),
      http.patch(SETTINGS_PATH, () =>
        HttpResponse.json(
          {
            error: {
              code: "validation_error",
              message: "Ensure this value is greater than or equal to 0.",
              details: { outside_valley_fee: ["Ensure this value is greater than or equal to 0."] },
            },
          },
          { status: 400 },
        ),
      ),
    );
    renderApp("/settings/shipping");

    await user.click(await screen.findByRole("button", { name: "Save settings" }));

    expect(
      await screen.findByText("Ensure this value is greater than or equal to 0."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Outside the valley")).toHaveAttribute("aria-invalid", "true");
  });
});
