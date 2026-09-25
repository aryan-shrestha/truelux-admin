import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderDetail } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

export function OrderItemsCard({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item, index) => (
              <TableRow key={`${item.sku}-${index}`}>
                <TableCell>
                  <div className="font-medium">{item.product_name}</div>
                  <div className="text-muted-foreground text-xs">
                    {item.variant_shade
                      ? `${item.variant_size}, ${item.variant_shade}`
                      : item.variant_size}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                <TableCell className="text-right">{formatMoney(item.unit_price)}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{formatMoney(item.line_total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Subtotal</TableCell>
              <TableCell className="text-right">{formatMoney(order.subtotal)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4}>Shipping</TableCell>
              <TableCell className="text-right">{formatMoney(order.shipping_fee)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={4} className="font-semibold">
                Total, collected on delivery
              </TableCell>
              <TableCell className="text-right font-semibold">{formatMoney(order.total)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
