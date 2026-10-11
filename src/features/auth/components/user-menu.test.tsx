import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { readSession, saveSession } from "@/lib/repositories/session";
import { useUiStore } from "@/stores/ui.store";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { dashboardHandler } from "@/test/dashboard";
import { meHandler } from "@/test/staff";

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler, dashboardHandler());
});

afterEach(() => {
  localStorage.clear();
  useUiStore.setState({ theme: "system" });
});

async function openUserMenu() {
  const user = userEvent.setup();
  renderApp("/");
  await user.click(await screen.findByRole("button", { name: /Asha Rai/ }));
  return user;
}

describe("UserMenu", () => {
  it("shows the signed-in staff member", async () => {
    await openUserMenu();

    expect(await screen.findByRole("menu")).toHaveTextContent("asha@truelux.test");
  });

  it("switches the theme", async () => {
    const user = await openUserMenu();

    await user.click(await screen.findByRole("menuitemradio", { name: "Dark" }));

    expect(useUiStore.getState().theme).toBe("dark");
  });

  it("revokes the refresh token, forgets the session and returns to sign-in", async () => {
    let sentBody: unknown;
    server.use(
      http.post("*/api/v1/auth/logout/", async ({ request }) => {
        sentBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = await openUserMenu();

    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(sentBody).toEqual({ refresh: "r1" });
    expect(readSession()).toBeNull();
  });

  it("signs out locally even when the API refuses the refresh token", async () => {
    server.use(
      http.post("*/api/v1/auth/logout/", () =>
        HttpResponse.json(
          {
            error: {
              code: "invalid_refresh_token",
              message: "The refresh token is invalid.",
              details: {},
            },
          },
          { status: 422 },
        ),
      ),
    );
    const user = await openUserMenu();

    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });
});
