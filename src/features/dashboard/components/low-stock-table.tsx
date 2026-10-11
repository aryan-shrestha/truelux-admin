import { PackageCheckIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { LowStockVariant } from "../schemas/dashboard.schema";

// The product name becomes a link to its Variants tab when the products feature adds
// that route (products.md).
export function LowStockTable({ variants }: { variants: readonly LowStockVariant[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Low stock</CardTitle>
        <CardDescription>Variants with five or fewer left, lowest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <EmptyState
            icon={PackageCheckIcon}
            title="Stock is healthy"
            description="No variant is running low."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.variant_id}>
                  <TableCell className="font-medium whitespace-normal">
                    {variant.product_name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                  <TableCell>
                    {variant.shade === null ? variant.size : `${variant.size}, ${variant.shade}`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={variant.stock_quantity === 0 ? "destructive" : "warning"}>
                      {variant.stock_quantity === 0 ? "Out" : variant.stock_quantity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
