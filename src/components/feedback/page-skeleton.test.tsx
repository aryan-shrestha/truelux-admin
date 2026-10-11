import { render, screen } from "@testing-library/react";

import { PageSkeleton } from "./page-skeleton";

describe("PageSkeleton", () => {
  it("announces that the page is loading", () => {
    render(<PageSkeleton />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});
