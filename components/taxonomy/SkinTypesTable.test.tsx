import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SkinTypesTable } from "@/components/taxonomy/SkinTypesTable";
import { removeTaxonomy } from "@/lib/taxonomy/actions";
import { taxonomyKeys } from "@/lib/taxonomy/queries";
import { sentPath } from "@/tests/fixtures/http";
import { renderWithQuery, testQueryClient } from "@/tests/fixtures/query";
import { router } from "@/tests/fixtures/router";

vi.mock("next/navigation", async () => (await import("@/tests/fixtures/router")).navigationModule);
vi.mock("@/lib/taxonomy/actions", () => ({ removeTaxonomy: vi.fn(), saveSkinType: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  router.searchParams = new URLSearchParams();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

const skinTypes = [
  { id: "st1", name: "Oily", slug: "oily", sort_order: 0, product_count: 4 },
  { id: "st2", name: "Mature", slug: "mature", sort_order: 1, product_count: 0 },
];

function renderTable() {
  const client = testQueryClient();
  client.setQueryData(taxonomyKeys.kind("skin-types"), skinTypes);
  return renderWithQuery(<SkinTypesTable />, client);
}

describe("SkinTypesTable", () => {
  it("filters the cached list by ?q= without a request", () => {
    router.searchParams = new URLSearchParams("q=mat");
    renderTable();

    expect(screen.getByText("Mature")).toBeInTheDocument();
    expect(screen.queryByText("Oily")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refetches the list after a delete", async () => {
    vi.mocked(removeTaxonomy).mockResolvedValueOnce({ ok: true, data: null });
    fetchMock.mockResolvedValue(Response.json([skinTypes[1]]));
    renderTable();

    await userEvent.click(screen.getByRole("button", { name: "Actions for Oily" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByText("Oily")).not.toBeInTheDocument());
    expect(sentPath(fetchMock)).toBe("/api/taxonomy/skin-types");
  });

  it("warns that deleting detaches the skin type from its products", async () => {
    vi.mocked(removeTaxonomy).mockResolvedValueOnce({ ok: true, data: null });
    renderTable();

    await userEvent.click(screen.getByRole("button", { name: "Actions for Oily" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      "It will be removed from the 4 products that list it.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(removeTaxonomy).toHaveBeenCalledWith("skin-types", "st1");
  });

  it("says only that it cannot be undone when no product uses it", async () => {
    renderTable();

    await userEvent.click(screen.getByRole("button", { name: "Actions for Mature" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("This cannot be undone.");
    expect(dialog).not.toHaveTextContent("removed from");
  });
});
