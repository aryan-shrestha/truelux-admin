import { z } from "zod";

import { ORDER_LIST_ITEM_SCHEMA } from "@/features/orders";

export const SALES_DAY_SCHEMA = z.object({
  date: z.iso.date(),
  orders: z.number().int(),
  revenue: z.string(),
});

export type SalesDay = z.infer<typeof SALES_DAY_SCHEMA>;

export const LOW_STOCK_VARIANT_SCHEMA = z.object({
  variant_id: z.uuid(),
  product_id: z.uuid(),
  product_name: z.string(),
  sku: z.string(),
  size: z.string(),
  shade: z.string().nullable(),
  stock_quantity: z.number().int(),
});

export type LowStockVariant = z.infer<typeof LOW_STOCK_VARIANT_SCHEMA>;

export const DASHBOARD_SCHEMA = z.object({
  orders_by_status: z.object({
    pending: z.number().int(),
    confirmed: z.number().int(),
    shipped: z.number().int(),
    delivered: z.number().int(),
    cancelled: z.number().int(),
  }),
  revenue: z.object({
    today: z.string(),
    last_7_days: z.string(),
    last_30_days: z.string(),
  }),
  sales_by_day: z.array(SALES_DAY_SCHEMA),
  recent_orders: z.array(ORDER_LIST_ITEM_SCHEMA),
  low_stock: z.array(LOW_STOCK_VARIANT_SCHEMA),
});

export type Dashboard = z.infer<typeof DASHBOARD_SCHEMA>;
