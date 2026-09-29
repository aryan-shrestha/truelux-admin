import { useQuery } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RefreshButton } from "@/components/shell/RefreshButton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { renderWithQuery, testQueryClient } from "@/tests/fixtures/query";

function Shown({ fetch }: { fetch: () => Promise<string> }) {
  useQuery({ queryKey: ["shown"], queryFn: fetch });
  return null;
}

describe("RefreshButton", () => {
  it("refetches what the page shows and nothing else, then says so", async () => {
    let resolve: (value: string) => void = () => {};
    const shown = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("initial")
      .mockReturnValueOnce(
        new Promise((done) => {
          resolve = done;
        }),
      );
    const hidden = vi.fn(async () => "hidden");
    const client = testQueryClient();
    client.setQueryData(["hidden"], "cached");
    client.setQueryDefaults(["hidden"], { queryFn: hidden });
    renderWithQuery(
      <TooltipProvider>
        <Shown fetch={shown} />
        <RefreshButton />
      </TooltipProvider>,
      client,
    );
    await waitFor(() => expect(shown).toHaveBeenCalledOnce());
    const button = await screen.findByRole("button", { name: "Refresh data" });
    await waitFor(() => expect(button).toBeEnabled());

    await userEvent.click(button);

    expect(shown).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute("aria-busy", "true");
    resolve("refreshed");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Data refreshed"));
    expect(button).toBeEnabled();
    expect(hidden).not.toHaveBeenCalled();
  });
});
