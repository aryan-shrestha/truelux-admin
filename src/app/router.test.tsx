import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { dashboardHandler } from "@/test/dashboard";
import { meHandler, STAFF_USER } from "@/test/staff";

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

  it("shows the page's breadcrumb in the top bar", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    server.use(meHandler, dashboardHandler());

    renderApp("/");

    const heading = await screen.findByRole("heading", { name: "Dashboard" });
    const breadcrumb = screen.getByRole("navigation", { name: "breadcrumb" });
    const topbar = breadcrumb.closest("header");
    expect(topbar).not.toBeNull();
    expect(topbar).not.toContainElement(heading);
    expect(within(breadcrumb).getByText("Dashboard")).toHaveAttribute("aria-current", "page");
  });

  it("shows the authenticating screen at once while a first load checks the session", async () => {
    saveSession({ access: "a1", refresh: "r1" });
    server.use(
      http.get("*/api/v1/auth/me/", async () => {
        await delay(300);
        return HttpResponse.json(STAFF_USER);
      }),
      dashboardHandler(),
    );

    renderApp("/");

    expect(await screen.findByText("Authenticating…", {}, { timeout: 250 })).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Dashboard" }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("refreshes the token out of sight once the tab has loaded", async () => {
    const user = userEvent.setup();
    saveSession({ access: "a1", refresh: "r1" });
    let isRefreshed = false;
    server.use(
      meHandler,
      dashboardHandler(),
      http.get("*/api/v1/admin/orders/", ({ request }) =>
        request.headers.get("Authorization") === "Bearer a2"
          ? HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
          : HttpResponse.json(
              { error: { code: "authentication_failed", message: "Expired.", details: {} } },
              { status: 401 },
            ),
      ),
      http.post("*/api/v1/auth/token/refresh/", async () => {
        await delay(200);
        isRefreshed = true;
        return HttpResponse.json({ access: "a2", refresh: "r2" });
      }),
    );
    renderApp("/");
    await screen.findByRole("heading", { name: "Dashboard" });
    let wasShown = false;
    const observer = new MutationObserver(() => {
      wasShown ||= document.body.textContent?.includes("Authenticating…") ?? false;
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    await user.click(
      within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", {
        name: "Orders",
      }),
    );

    // The dashboard's recent orders say "No orders yet" too, so wait for the Orders page
    // and the refresh before looking for its empty list.
    expect(await screen.findByRole("heading", { name: "Orders" })).toBeInTheDocument();
    await vi.waitFor(() => expect(isRefreshed).toBe(true));
    expect(await screen.findByText("No orders yet")).toBeInTheDocument();
    observer.disconnect();
    expect(wasShown).toBe(false);
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
