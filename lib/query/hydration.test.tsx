import { HydrationBoundary, QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithQuery, testQueryClient } from "@/tests/fixtures/query";

const KEY = ["products", "detail", "p1"];

function Name() {
  const { data } = useQuery({ queryKey: KEY, queryFn: () => "unused", enabled: false });
  return <p>{String(data)}</p>;
}

// Next reuses a visited route's server render, whose dehydrated data is as old as the
// first visit. The cache must win when it holds something newer.
describe("HydrationBoundary with a reused route", () => {
  it("keeps newer cached data over an older payload", () => {
    const server = new QueryClient();
    server.setQueryData(KEY, "first visit", { updatedAt: 1_000 });
    const payload = dehydrate(server);
    const client = testQueryClient();
    client.setQueryData(KEY, "after a mutation", { updatedAt: 2_000 });

    renderWithQuery(
      <HydrationBoundary state={payload}>
        <Name />
      </HydrationBoundary>,
      client,
    );

    expect(screen.getByText("after a mutation")).toBeInTheDocument();
  });
});
