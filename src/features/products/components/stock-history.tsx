import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { HistoryIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/date";
import { describeError } from "@/lib/repositories/errors";

import { stockQueries } from "../queries/products.queries";
import type { Variant } from "../schemas/product.schema";
import { STOCK_REASON_LABEL, type StockMovement } from "../schemas/stock-movement.schema";

export function StockHistory({
  variant,
  open,
  onOpenChange,
}: {
  variant: Variant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Stock history of {variant.sku}</SheetTitle>
          <SheetDescription>{variant.stock_quantity} in stock. Newest first.</SheetDescription>
        </SheetHeader>
        {/* Fetched only when opened: most rows' histories are never looked at. */}
        <div className="overflow-y-auto px-4 pb-4">
          {open && <Movements variantId={variant.id} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Movements({ variantId }: { variantId: string }) {
  const { data, error, isPending } = useQuery(stockQueries.variant(variantId));

  if (isPending) return <Skeleton className="h-40 w-full" />;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{describeError(error)}</AlertDescription>
      </Alert>
    );
  }
  if (data.results.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title="No stock changes yet"
        description="Changes appear here from the next sale or adjustment."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>What</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="text-right">After</TableHead>
            <TableHead>By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.results.map((movement) => (
            <MovementRow key={movement.id} movement={movement} />
          ))}
        </TableBody>
      </Table>
      {data.count > data.results.length && (
        <p className="mt-2 text-sm text-muted-foreground">
          Showing the latest {data.results.length} of {data.count} changes.
        </p>
      )}
    </>
  );
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const change = movement.quantity_change;

  return (
    <TableRow className="align-top">
      <TableCell className="whitespace-nowrap">{formatDateTime(movement.created_at)}</TableCell>
      <TableCell>
        <div>{STOCK_REASON_LABEL[movement.reason]}</div>
        {movement.order_id !== null && movement.order_number !== null && (
          <Link
            to="/orders/$orderId"
            params={{ orderId: movement.order_id }}
            className="font-mono text-xs hover:underline"
          >
            {movement.order_number}
          </Link>
        )}
        {movement.note && <div className="text-xs text-muted-foreground">{movement.note}</div>}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {change > 0 ? `+${change}` : change}
      </TableCell>
      <TableCell className="text-right tabular-nums">{movement.balance_after}</TableCell>
      <TableCell className="text-muted-foreground">
        {movement.actor_email ?? (movement.reason === "sale" ? "Customer" : "—")}
      </TableCell>
    </TableRow>
  );
}
