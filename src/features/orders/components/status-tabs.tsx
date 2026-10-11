import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ORDER_STATUS } from "../order-status";
import { ORDER_STATUS_SCHEMA, type OrderStatus } from "../schemas/order-status.schema";

const ALL = "all";

export function StatusTabs({
  selected,
  onSelect,
}: {
  selected: readonly OrderStatus[] | undefined;
  onSelect: (statuses: OrderStatus[] | undefined) => void;
}) {
  // Two or more statuses (the dashboard's "awaiting action" link) match no single tab.
  const value = selected === undefined ? ALL : selected.length === 1 ? (selected[0] ?? ALL) : "";

  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        const status = ORDER_STATUS_SCHEMA.safeParse(next);
        onSelect(status.success ? [status.data] : undefined);
      }}
    >
      <div className="overflow-x-auto pb-1">
        <TabsList className="w-max">
          <TabsTrigger value={ALL}>All</TabsTrigger>
          {ORDER_STATUS_SCHEMA.options.map((status) => (
            <TabsTrigger key={status} value={status}>
              {ORDER_STATUS[status].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
