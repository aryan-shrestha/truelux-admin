import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

// A signed-in page. From `md` up it fills the frame under the top bar, and the frame
// never scrolls: a page scrolls as a whole only with `isScrollable` (the dashboard);
// otherwise its table body or form section does, each shrinking (`md:min-h-0`) only
// when its content is taller than the space left. Below `md` the page scrolls
// normally, because nested scroll areas are awkward on a phone.
//
// Every scroll region is `relative`: an absolutely positioned descendant (Radix's
// hidden form inputs, for one) is otherwise placed against an outer element and
// stretches the whole document past the window.
export function Page({
  isScrollable = false,
  children,
}: {
  isScrollable?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-6 p-4 md:min-h-0 md:flex-1 md:p-6",
        isScrollable && "md:overflow-y-auto",
      )}
    >
      {children}
    </div>
  );
}
