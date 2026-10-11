import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

const SHADES_PATH = "*/api/v1/admin/shades/";

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(
    meHandler,
    http.get(SHADES_PATH, () => HttpResponse.json([])),
  );
});

afterEach(() => localStorage.clear());

describe("shades", () => {
  it("keeps the colour picker and the hex text in step and sends the hex in capitals", async () => {
    const user = userEvent.setup();
    let sentBody: unknown;
    server.use(
      http.post(SHADES_PATH, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          {
            id: crypto.randomUUID(),
            name: "Warm Beige",
            slug: "warm-beige",
            hex_code: "#112233",
            sort_order: 0,
            variant_count: 0,
          },
          { status: 201 },
        );
      }),
    );
    renderApp("/shades");
    await user.click(await screen.findByRole("button", { name: "New shade" }));
    const dialog = await screen.findByRole("dialog");
    const picker = within(dialog).getByLabelText("Pick the colour");
    const hex = within(dialog).getByLabelText("Colour");

    // user-event cannot drive a native colour picker; this is the event it fires.
    fireEvent.input(picker, { target: { value: "#112233" } });
    expect(hex).toHaveValue("#112233");
    await user.clear(hex);
    await user.type(hex, "#a1b2c3");
    expect(picker).toHaveValue("#a1b2c3");
    await user.type(within(dialog).getByLabelText("Name"), "Warm Beige");
    await user.click(within(dialog).getByRole("button", { name: "Create shade" }));

    await screen.findByText("Shade created");
    expect(sentBody).toEqual({ name: "Warm Beige", hex_code: "#A1B2C3", sort_order: 0 });
  });
});
