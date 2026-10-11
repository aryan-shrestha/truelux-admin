import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

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

// Pagination and sorting happen on the API, so the table only renders the current page.
// The page lives in the route's 1-based `page` search param, and the pager is made of
// real links, so the back button, a reload and a middle-click all keep the page.
export function DataTable<TData, TValue>({
  columns,
  data,
  rowCount,
  pagination,
  sorting = [],
  onSortingChange,
  isLoading = false,
  isPlaceholderData = false,
  empty = "No results.",
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowCount: number;
  pagination: PaginationState;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  isLoading?: boolean;
  isPlaceholderData?: boolean;
  empty?: ReactNode;
}) {
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable functions by design; nothing here is memoised on them.
  const table = useReactTable({
    columns,
    data,
    rowCount,
    state: { pagination, sorting },
    onSortingChange,
    manualPagination: true,
    manualSorting: true,
    enableSorting: onSortingChange !== undefined,
    getCoreRowModel: getCoreRowModel(),
  });

  const pageCount = Math.max(table.getPageCount(), 1);
  const page = pagination.pageIndex + 1;
  const firstRow = rowCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastRow = Math.min(page * pagination.pageSize, rowCount);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
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
                          className="inline-flex items-center gap-1"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection === "asc" && <ArrowUpIcon className="size-3.5" />}
                          {sortDirection === "desc" && <ArrowDownIcon className="size-3.5" />}
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p aria-live="polite">
          {rowCount === 0 ? "No results" : `${firstRow}–${lastRow} of ${rowCount}`}
        </p>
        <div className="flex items-center gap-2">
          <span>
            Page {page} of {pageCount}
          </span>
          {table.getCanPreviousPage() ? (
            <PageLink page={page - 1} label="Previous page">
              <ChevronLeftIcon />
            </PageLink>
          ) : (
            <Button variant="outline" size="icon" aria-label="Previous page" disabled>
              <ChevronLeftIcon />
            </Button>
          )}
          {table.getCanNextPage() ? (
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
    </div>
  );
}
