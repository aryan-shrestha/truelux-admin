import { z } from "zod";

import { ORDER_STATUS_SCHEMA } from "./order-status.schema";

export const ORDER_LIST_ITEM_SCHEMA = z.object({
  id: z.uuid(),
  order_number: z.string(),
  status: ORDER_STATUS_SCHEMA,
  full_name: z.string(),
  phone: z.string(),
  total: z.string(),
  item_count: z.number().int(),
  created_at: z.iso.datetime({ offset: true }),
});

export type OrderListItem = z.infer<typeof ORDER_LIST_ITEM_SCHEMA>;

export const ORDER_ITEM_SCHEMA = z.object({
  product_name: z.string(),
  sku: z.string(),
  variant_size: z.string(),
  variant_shade: z.string(),
  quantity: z.number().int(),
  unit_price: z.string(),
  line_total: z.string(),
});

export type OrderItem = z.infer<typeof ORDER_ITEM_SCHEMA>;

export const ORDER_SCHEMA = ORDER_LIST_ITEM_SCHEMA.extend({
  email: z.string(),
  address_line: z.string(),
  city: z.string(),
  district: z.string(),
  note: z.string(),
  subtotal: z.string(),
  shipping_fee: z.string(),
  payment_method: z.string(),
  allowed_transitions: z.array(ORDER_STATUS_SCHEMA),
  items: z.array(ORDER_ITEM_SCHEMA),
});

export type Order = z.infer<typeof ORDER_SCHEMA>;
