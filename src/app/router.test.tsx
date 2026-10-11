import { screen, within } from "@testing-library/react";

import { saveSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { dashboardHandler } from "@/test/dashboard";
import { meHandler } from "@/test/staff";

afterEach(() => localStorage.clear());

describe("route tree", () => {
  it("renders the dashboard inside the sidebar shell for a signed-in user", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    server.use(meHandler, dashboardHandler());

    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Main" });
    expect(within(navigation).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("sends an anonymous visit to the sign-in page without the sidebar", async () => {
    const { router } = renderApp("/");

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.queryByRole("navigation", { name: "Main" })).not.toBeInTheDocument();
  });

  it("sends a signed-in user on from the sign-in page to the next path", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    server.use(meHandler, dashboardHandler());

    const { router } = renderApp("/login?next=%2F");

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("renders the not-found page for an unknown path", async () => {
    renderApp("/no-such-page");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});
