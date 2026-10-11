import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DataTable } from "./data-table";

interface Brand {
  name: string;
}

const COLUMNS: ColumnDef<Brand>[] = [{ accessorKey: "name", header: "Name" }];

describe("DataTable", () => {
  it("renders the rows it is given", () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={[{ name: "Lakmé" }, { name: "Maybelline" }]}
        rowCount={2}
        pagination={{ pageIndex: 0, pageSize: 25 }}
        onPaginationChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("cell", { name: "Lakmé" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Maybelline" })).toBeInTheDocument();
  });

  it("shows the empty message when there are no rows", () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={[]}
        rowCount={0}
        pagination={{ pageIndex: 0, pageSize: 25 }}
        onPaginationChange={vi.fn()}
        emptyMessage="No brands yet."
      />,
    );

    expect(screen.getByText("No brands yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("asks for the next page using the API's row count", async () => {
    const onPaginationChange = vi.fn();
    render(
      <DataTable
        columns={COLUMNS}
        data={[{ name: "Lakmé" }]}
        rowCount={60}
        pagination={{ pageIndex: 0, pageSize: 25 }}
        onPaginationChange={onPaginationChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    const updater = onPaginationChange.mock.calls[0]?.[0] as (state: object) => object;
    expect(updater({ pageIndex: 0, pageSize: 25 })).toEqual({ pageIndex: 1, pageSize: 25 });
  });
});
