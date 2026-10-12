import { BoxesIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";

import type { Product } from "../schemas/product.schema";
import { VariantRow } from "./variant-row";
import { VariantSheet } from "./variant-sheet";

export function VariantsEditor({ product }: { product: Product }) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <Card className="md:min-h-0">
      <CardHeader>
        <CardTitle>Variants</CardTitle>
        <CardDescription>
          Each size and shade a product comes in. A blank price uses the base price,{" "}
          {formatMoney(product.base_price)}. Opening stock is set when a variant is added; after
          that, use Change stock, which keeps a history. To put a variant on sale, lower its price
          (or the base price) and enter the old price as the compare-at price; clear the compare-at
          price to end the sale.
        </CardDescription>
        <CardAction>
          <Button variant="outline" onClick={() => setIsAdding(true)}>
            <PlusIcon data-icon="inline-start" />
            Add variant
          </Button>
        </CardAction>
      </CardHeader>
      {/* The table body scrolls under its sticky header row; Add variant stays in view. */}
      <CardContent className="flex flex-col md:min-h-0 md:[&>[data-slot=table-container]]:min-h-0 md:[&>[data-slot=table-container]]:overflow-auto">
        {product.variants.length === 0 ? (
          <EmptyState
            icon={BoxesIcon}
            title="No variants yet"
            description="A product needs at least one variant before it can be published."
          />
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Shade</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Compare-at price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants.map((variant) => (
                <VariantRow
                  key={variant.id}
                  productId={product.id}
                  basePrice={product.base_price}
                  variant={variant}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <VariantSheet
        productId={product.id}
        basePrice={product.base_price}
        open={isAdding}
        onOpenChange={setIsAdding}
      />
    </Card>
  );
}
