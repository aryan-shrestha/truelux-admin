import { PackageCheckIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableEmpty } from "@/components/data-table/TableEmpty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LowStockVariant } from "@/lib/api/types";

export function LowStockTable({ variants }: { variants: LowStockVariant[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Low stock</CardTitle>
        <CardDescription>Variants with five or fewer left, lowest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <TableEmpty
            icon={PackageCheckIcon}
            title={"Stock is healthy"}
            description={"No variant is running low."}
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
                  <TableCell>
                    <Link
                      href={`/products/${variant.product_id}?tab=variants`}
                      className="font-medium hover:underline"
                    >
                      {variant.product_name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                  <TableCell>
                    {variant.shade ? `${variant.size}, ${variant.shade}` : variant.size}
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
