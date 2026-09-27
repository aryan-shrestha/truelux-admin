"use client";

import type { MouseEvent } from "react";

import { useUrlParams } from "@/components/data-table/use-url-params";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  count: number;
  hrefFor: (page: number) => string;
};

export function TablePagination({ page, pageSize, count, hrefFor }: TablePaginationProps) {
  const { go } = useUrlParams();
  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  // A modified click keeps the link's own behaviour (a new tab, a download).
  function follow(event: MouseEvent<HTMLAnchorElement>, target: number) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    go(hrefFor(target));
  }

  const first = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, count);

  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
      <p aria-live="polite">{count === 0 ? "No results" : `${first}–${last} of ${count}`}</p>
      {pageCount > 1 ? (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={hrefFor(page - 1)}
                onClick={(event) => follow(event, page - 1)}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
                className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            <PaginationItem className="px-2 tabular-nums">
              Page {page} of {pageCount}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href={hrefFor(page + 1)}
                onClick={(event) => follow(event, page + 1)}
                aria-disabled={page >= pageCount}
                tabIndex={page >= pageCount ? -1 : undefined}
                className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
