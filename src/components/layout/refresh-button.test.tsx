import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TooltipProvider } from "@/components/ui/tooltip";

import { RefreshButton } from "./refresh-button";

function Orders({ fetchOrders }: { fetchOrders: () => Promise<string> }) {
  const { data } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders, staleTime: Infinity });
  return <p>{data}</p>;
}

describe("RefreshButton", () => {
  it("refetches the queries on screen and announces the refresh", async () => {
    const user = userEvent.setup();
    let fetchCount = 0;
    const fetchOrders = () => Promise.resolve(`Fetched ${(fetchCount += 1)} times`);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TooltipProvider>
          <Orders fetchOrders={fetchOrders} />
          <RefreshButton />
        </TooltipProvider>
      </QueryClientProvider>,
    );
    await screen.findByText("Fetched 1 times");

    await user.click(screen.getByRole("button", { name: "Refresh data" }));

    expect(await screen.findByText("Fetched 2 times")).toBeInTheDocument();
    expect(screen.getByText("Data refreshed")).toBeInTheDocument();
  });
});
