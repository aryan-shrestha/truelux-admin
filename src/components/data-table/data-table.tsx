import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SKELETON_ROWS = 5;

// The table is shared, so the router cannot type a link relative to whichever route
// renders it; every such route has a 1-based `page` search param (convention.md).
function pageSearch(page: number) {
  return ((previous: Record<string, unknown>) => ({ ...previous, page })) as never;
}

function PageLink({ page, label, children }: { page: number; label: string; children: ReactNode }) {
  return (
    <Button variant="outline" size="icon" asChild>
      <Link to="." search={pageSearch(page)} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

interface Pagination {
  pageIndex: number;
  pageSize: number;
  rowCount: number;
}

// Pagination and sorting happen on the API, so the table only renders the rows it is
// given. A paginated list passes `pagination` with the API's `count` as `rowCount`: the
// page lives in the route's 1-based
// `page` search param, and the pager is made of real links, so the back button, a
// reload and a middle-click all keep the page. A whole-array list passes none and gets
// no pager. A list with row actions passes `rowActions`, which wraps each row (a
// `RowMenu` with the row's dialogs, see row-menu.tsx).
export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  sorting = [],
  onSortingChange,
  rowActions: RowActions,
  isLoading = false,
  isPlaceholderData = false,
  empty = "No results.",
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: Pagination;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  rowActions?: ComponentType<{ row: TData; children: ReactNode }>;
  isLoading?: boolean;
  isPlaceholderData?: boolean;
  empty?: ReactNode;
}) {
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable functions by design; nothing here is memoised on them.
  const table = useReactTable({
    columns,
    data,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    enableSorting: onSortingChange !== undefined,
    // One column at a time, toggling between ascending and descending: the API's
    // `ordering` lives in a single URL param, and an unsorted list is still in the
    // API's default order.
    enableMultiSort: false,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
  });

  // The body scrolls inside the bordered box under a sticky header row, while the
  // pager stays below it; the box shrinks only when the rows outgrow the page.
  return (
    <div className="flex flex-col gap-4 md:min-h-0">
      <div className="flex flex-col overflow-hidden rounded-md border md:min-h-0 md:[&>[data-slot=table-container]]:min-h-0 md:[&>[data-slot=table-container]]:overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sortDirection === "asc"
                          ? "ascending"
                          : sortDirection === "desc"
                            ? "descending"
                            : undefined
                      }
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="flex w-full items-center gap-1 hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection === "asc" && <ArrowUpIcon className="size-3.5" />}
                          {sortDirection === "desc" && <ArrowDownIcon className="size-3.5" />}
                          {sortDirection === false && (
                            <ArrowUpDownIcon className="size-3.5 text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            aria-busy={isPlaceholderData}
            className={isPlaceholderData ? "opacity-60" : undefined}
          >
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {empty}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const tableRow = (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
                return RowActions === undefined ? (
                  tableRow
                ) : (
                  <RowActions key={row.id} row={row.original}>
                    {tableRow}
                  </RowActions>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && <Pager {...pagination} />}
    </div>
  );
}

function Pager({ pageIndex, pageSize, rowCount }: Pagination) {
  const page = pageIndex + 1;
  const pageCount = Math.max(Math.ceil(rowCount / pageSize), 1);
  const firstRow = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(page * pageSize, rowCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <p aria-live="polite">
        {rowCount === 0 ? "No results" : `${firstRow}–${lastRow} of ${rowCount}`}
      </p>
      <div className="flex items-center gap-2">
        <span>
          Page {page} of {pageCount}
        </span>
        {page > 1 ? (
          <PageLink page={page - 1} label="Previous page">
            <ChevronLeftIcon />
          </PageLink>
        ) : (
          <Button variant="outline" size="icon" aria-label="Previous page" disabled>
            <ChevronLeftIcon />
          </Button>
        )}
        {page < pageCount ? (
          <PageLink page={page + 1} label="Next page">
            <ChevronRightIcon />
          </PageLink>
        ) : (
          <Button variant="outline" size="icon" aria-label="Next page" disabled>
            <ChevronRightIcon />
          </Button>
        )}
      </div>
    </div>
  );
}
