import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { readSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

afterEach(() => localStorage.clear());

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm", () => {
  it("blocks the submit and explains each invalid field", async () => {
    const user = userEvent.setup();
    renderApp("/login");

    await user.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows one generic message without marking a field when the API refuses", async () => {
    server.use(
      http.post("*/api/v1/auth/token/", () =>
        HttpResponse.json(
          {
            error: {
              code: "authentication_failed",
              message: "No active account found with the given credentials",
              details: {},
            },
          },
          { status: 401 },
        ),
      ),
    );
    renderApp("/login");

    await fillAndSubmit("asha@truelux.test", "wrong-password");

    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "false");
    expect(readSession()).toBeNull();
  });

  it("stores the tokens and opens the next page after signing in", async () => {
    let sentBody: unknown;
    server.use(
      http.post("*/api/v1/auth/token/", async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ access: "a1", refresh: "r1" });
      }),
      meHandler,
    );
    const { router } = renderApp("/login?next=%2F");

    await fillAndSubmit("asha@truelux.test", "correct-password");

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(sentBody).toEqual({ email: "asha@truelux.test", password: "correct-password" });
    expect(readSession()).toEqual({ access: "a1", refresh: "r1" });
  });

  it("says the session ended when the tab was sent back to sign in", async () => {
    renderApp("/login?expired=1");

    expect(await screen.findByText("Your session has ended. Sign in again.")).toBeInTheDocument();
  });
});
