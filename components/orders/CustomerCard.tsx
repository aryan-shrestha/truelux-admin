import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { OrderDetail } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format/date";

export function CustomerCard({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Name</dt>
          <dd>{order.full_name}</dd>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>
            <a href={`tel:${order.phone}`} className="font-mono hover:underline">
              {order.phone}
            </a>
          </dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="break-all">{order.email}</dd>
        </dl>
        <Separator />
        <address className="not-italic">
          {order.address_line}
          <br />
          {order.city}, {order.district}
        </address>
        <Separator />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Placed</dt>
          <dd>{formatDateTime(order.created_at)}</dd>
          <dt className="text-muted-foreground">Payment</dt>
          <dd>{order.payment_method === "cod" ? "Cash on delivery" : order.payment_method}</dd>
        </dl>
        {order.note ? (
          <>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Note from the customer</span>
              <p className="whitespace-pre-line">{order.note}</p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
