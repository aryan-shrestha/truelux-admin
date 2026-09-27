import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TablePagination } from "@/components/data-table/TablePagination";
import { UrlSearch } from "@/components/data-table/UrlSearch";
import { UrlSelect } from "@/components/data-table/UrlSelect";
import { router } from "@/tests/fixtures/router";

vi.mock("next/navigation", async () => (await import("@/tests/fixtures/router")).navigationModule);

const replaceState = vi.spyOn(window.history, "replaceState");

function replacedUrls(): string[] {
  return replaceState.mock.calls.map(([, , url]) => String(url));
}

beforeEach(() => {
  router.searchParams = new URLSearchParams("brand=b1&page=4");
  replaceState.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("URL-driven table controls", () => {
  it("writes the search to ?q= after a pause, keeps other filters and resets the page", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<UrlSearch label="Search products" />);

    await userEvent.type(screen.getByRole("searchbox", { name: "Search products" }), "silk");
    expect(replaceState).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));

    expect(replacedUrls()).toEqual(["/products?brand=b1&q=silk"]);
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

    expect(replacedUrls().at(-1)).toBe("/products?brand=b1&published=yes");
  });

  it("pages with pushState on a plain click and leaves a modified click to the browser", async () => {
    const pushState = vi.spyOn(window.history, "pushState").mockImplementation(() => {});
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(
      <TablePagination
        page={1}
        pageSize={25}
        count={60}
        hrefFor={(target) => `/products?page=${target}`}
      />,
    );
    const next = screen.getByRole("link", { name: "Go to next page" });

    expect(next).toHaveAttribute("href", "/products?page=2");
    await userEvent.click(next);
    expect(pushState).toHaveBeenCalledWith(null, "", "/products?page=2");

    pushState.mockClear();
    const modified = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });
    next.dispatchEvent(modified);
    expect(pushState).not.toHaveBeenCalled();
    expect(modified.defaultPrevented).toBe(false);
  });
});
