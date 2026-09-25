import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UrlSearch } from "@/components/data-table/UrlSearch";
import { UrlSelect } from "@/components/data-table/UrlSelect";
import { router } from "@/tests/fixtures/router";

vi.mock("next/navigation", async () => (await import("@/tests/fixtures/router")).navigationModule);

beforeEach(() => {
  router.searchParams = new URLSearchParams("brand=b1&page=4");
  router.replace.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("URL-driven table controls", () => {
  it("writes the search to ?q= after a pause, keeps other filters and resets the page", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<UrlSearch label="Search products" />);

    await userEvent.type(screen.getByRole("searchbox", { name: "Search products" }), "silk");
    expect(router.replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/products?brand=b1&q=silk", { scroll: false });
  });

  it("writes a chosen filter to the URL and removes it for the catch-all option", async () => {
    render(
      <UrlSelect
        param="published"
        label="Status"
        anyLabel="Any status"
        options={[{ value: "yes", label: "Published" }]}
      />,
    );

    await userEvent.click(screen.getByRole("combobox", { name: "Status" }));
    await userEvent.click(await screen.findByRole("option", { name: "Published" }));

    expect(router.replace).toHaveBeenLastCalledWith("/products?brand=b1&published=yes", {
      scroll: false,
    });
  });
});
