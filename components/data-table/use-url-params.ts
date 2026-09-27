"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type ParamChanges = Record<string, string | string[] | null>;

// Next syncs useSearchParams with the History API inside a transition, so a list's
// suspending query keeps the old rows on screen and `isPending` lasts until the new rows
// arrive. A router navigation would re-render the page on the server as well.
export function useUrlParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(changes: ParamChanges) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      next.delete(key);
      for (const item of value === null ? [] : [value].flat()) {
        if (item !== "") next.append(key, item);
      }
    }
    next.delete("page");
    const search = next.toString();
    startTransition(() => {
      window.history.replaceState(null, "", search ? `${pathname}?${search}` : pathname);
    });
  }

  function go(href: string) {
    startTransition(() => {
      window.history.pushState(null, "", href);
    });
    window.scrollTo({ top: 0 });
  }

  return { searchParams, update, go, isPending };
}
