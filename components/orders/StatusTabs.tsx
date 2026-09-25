"use client";

import { useUrlParams } from "@/components/data-table/use-url-params";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/api/types";
import { ORDER_STATUS } from "@/lib/orders/status";

const ALL = "all";

export function StatusTabs({ selected }: { selected: OrderStatus[] }) {
  const { update } = useUrlParams();
  // Two or more statuses (the dashboard's "awaiting action" link) match no single tab.
  const value = selected.length === 0 ? ALL : selected.length === 1 ? selected[0] : "";

  return (
    <Tabs value={value} onValueChange={(next) => update({ status: next === ALL ? null : next })}>
      <TabsList className="max-w-full justify-start overflow-x-auto">
        <TabsTrigger value={ALL}>All</TabsTrigger>
        {ORDER_STATUSES.map((status) => (
          <TabsTrigger key={status} value={status}>
            {ORDER_STATUS[status].label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
