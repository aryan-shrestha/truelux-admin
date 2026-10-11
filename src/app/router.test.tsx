import { createMemoryHistory } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";

import { Providers } from "./providers";
import { createQueryClient } from "./query-client";
import { createAppRouter } from "./router";

function renderAt(path: string) {
  const queryClient = createQueryClient();
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<Providers queryClient={queryClient} router={router} />);
}

describe("route tree", () => {
  it("renders the dashboard inside the sidebar shell", async () => {
    renderAt("/");

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  });

  it("renders the sign-in page without the sidebar", async () => {
    renderAt("/login");

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("renders the not-found page for an unknown path", async () => {
    renderAt("/no-such-page");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});
