import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { DataTable } from "./data-table";

interface Brand {
  name: string;
}

const COLUMNS: ColumnDef<Brand>[] = [{ accessorKey: "name", header: "Name" }];

// The pager links to the current route's `page`, so the table renders inside a router.
async function renderInRoute(table: ReactNode) {
  const rootRoute = createRootRoute();
  const brandsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/brands",
    component: () => table,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([brandsRoute]),
    history: createMemoryHistory({ initialEntries: ["/brands?q=lak"] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByRole("table");
}

describe("DataTable", () => {
  it("renders the rows it is given", async () => {
    await renderInRoute(
      <DataTable
        columns={COLUMNS}
        data={[{ name: "Lakmé" }, { name: "Maybelline" }]}
        pagination={{ pageIndex: 0, pageSize: 25, rowCount: 2 }}
      />,
    );

    expect(screen.getByRole("cell", { name: "Lakmé" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Maybelline" })).toBeInTheDocument();
    expect(screen.getByText("1–2 of 2")).toBeInTheDocument();
  });

  it("shows the empty state and no page links when there are no rows", async () => {
    await renderInRoute(
      <DataTable
        columns={COLUMNS}
        data={[]}
        pagination={{ pageIndex: 0, pageSize: 25, rowCount: 0 }}
        empty="No brands yet."
      />,
    );

    expect(screen.getByText("No brands yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("shows no pager for a whole-array list", async () => {
    await renderInRoute(<DataTable columns={COLUMNS} data={[{ name: "Lakmé" }]} />);

    expect(screen.getByRole("cell", { name: "Lakmé" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next page" })).not.toBeInTheDocument();
    expect(screen.queryByText(/of 1/)).not.toBeInTheDocument();
  });

  it("links to the neighbouring pages, keeping the other search params", async () => {
    await renderInRoute(
      <DataTable
        columns={COLUMNS}
        data={[{ name: "Lakmé" }]}
        pagination={{ pageIndex: 1, pageSize: 25, rowCount: 60 }}
      />,
    );

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("26–50 of 60")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "/brands?q=lak&page=1",
    );
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/brands?q=lak&page=3",
    );
  });
});
