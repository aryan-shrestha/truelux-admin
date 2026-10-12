import {
  HistoryIcon,
  MoreHorizontalIcon,
  PackagePlusIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { describeError } from "@/lib/repositories/errors";

import { useDeleteVariant } from "../queries/products.mutations";
import type { Variant } from "../schemas/product.schema";
import { StockDialog } from "./stock-dialog";
import { StockHistory } from "./stock-history";
import { VariantSheet } from "./variant-sheet";

type OpenPanel = "edit" | "stock" | "history" | "delete" | null;

export function VariantRow({
  productId,
  basePrice,
  variant,
}: {
  productId: string;
  basePrice: string;
  variant: Variant;
}) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const remove = useDeleteVariant(productId);

  function panelProps(panel: Exclude<OpenPanel, null>) {
    return {
      open: openPanel === panel,
      onOpenChange: (open: boolean) => setOpenPanel(open ? panel : null),
    };
  }

  function handleDelete() {
    remove.mutate(variant.id, {
      onSuccess: () => {
        toast.success(`${variant.sku} deleted`);
        setOpenPanel(null);
      },
      onError: (error) => {
        setOpenPanel(null);
        toast.error(
          error.code === "conflict"
            ? `${variant.sku} has been ordered, so it cannot be deleted. Set its stock to 0 instead.`
            : describeError(error),
        );
      },
    });
  }

  return (
    <TableRow>
      <TableCell className="font-mono">{variant.sku}</TableCell>
      <TableCell>{variant.size.name}</TableCell>
      <TableCell>
        {variant.shade === null ? (
          <span className="text-muted-foreground">No shade</span>
        ) : (
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3 rounded-sm border"
              style={{ backgroundColor: variant.shade.hex_code }}
            />
            {variant.shade.name}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{variant.stock_quantity}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMoney(variant.price)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {variant.compare_at_price === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          formatMoney(variant.compare_at_price)
        )}
        {/* The API decides a variant is on sale and by how much; nothing is compared here. */}
        {variant.on_sale && variant.discount_percent !== null && (
          <Badge variant="info" className="ml-2">
            −{variant.discount_percent}%
          </Badge>
        )}
      </TableCell>
      <TableCell className="w-12">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${variant.sku}`}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setOpenPanel("edit")}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOpenPanel("stock")}>
              <PackagePlusIcon />
              Change stock
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOpenPanel("history")}>
              <HistoryIcon />
              Stock history
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setOpenPanel("delete")}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <VariantSheet
          productId={productId}
          basePrice={basePrice}
          variant={variant}
          {...panelProps("edit")}
        />
        <StockDialog productId={productId} variant={variant} {...panelProps("stock")} />
        <StockHistory variant={variant} {...panelProps("history")} />
        <ConfirmDialog
          title={`Delete ${variant.sku}?`}
          description="This cannot be undone."
          confirmLabel="Delete"
          isPending={remove.isPending}
          {...panelProps("delete")}
          onConfirm={handleDelete}
        />
      </TableCell>
    </TableRow>
  );
}
