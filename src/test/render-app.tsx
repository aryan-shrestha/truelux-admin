import { createMemoryHistory } from "@tanstack/react-router";
import { render } from "@testing-library/react";

import { Providers } from "@/app/providers";
import { createQueryClient } from "@/app/query-client";
import { createAppRouter } from "@/app/router";

export function renderApp(path: string) {
  const queryClient = createQueryClient();
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<Providers queryClient={queryClient} router={router} />);
  return { router, queryClient };
}
