import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QueryProvider } from "@/components/shell/QueryProvider";

describe("QueryProvider", () => {
  it("keeps one cache per signed-in user, so another sign-in starts empty", () => {
    const seen: QueryClient[] = [];
    function Probe() {
      seen.push(useQueryClient());
      return null;
    }

    const { rerender } = render(
      <QueryProvider userId="u1">
        <Probe />
      </QueryProvider>,
    );
    rerender(
      <QueryProvider userId="u1">
        <Probe />
      </QueryProvider>,
    );
    rerender(
      <QueryProvider userId="u2">
        <Probe />
      </QueryProvider>,
    );

    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).not.toBe(seen[0]);
  });
});
