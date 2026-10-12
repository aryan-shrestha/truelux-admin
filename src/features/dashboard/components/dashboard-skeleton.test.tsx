import { render, screen } from "@testing-library/react";

import { DashboardSkeleton } from "./dashboard-skeleton";

describe("DashboardSkeleton", () => {
  it("lays out the dashboard's cards while it loads", () => {
    const { container } = render(<DashboardSkeleton />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading the dashboard");
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(8);
  });
});
