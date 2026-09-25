import type { Dashboard, OrderDetail, OrderListItem } from "@/lib/api/types";

export const pendingOrder: OrderListItem = {
  id: "0d4c7c2e-4a3c-4f6a-9d8e-1a2b3c4d5e6f",
  order_number: "TL-000123",
  status: "pending",
  full_name: "Sita Sharma",
  phone: "9800000000",
  total: "5400.00",
  item_count: 2,
  created_at: "2026-09-25T04:15:00Z",
};

export const pendingOrderDetail: OrderDetail = {
  ...pendingOrder,
  email: "sita@example.com",
  address_line: "Jhamsikhel Road",
  city: "Lalitpur",
  district: "Lalitpur",
  note: "Call before delivery.",
  subtotal: "5250.00",
  shipping_fee: "150.00",
  payment_method: "cod",
  allowed_transitions: ["confirmed", "cancelled"],
  items: [
    {
      product_name: "Silk Foundation",
      sku: "LUM-SF-30-WB",
      variant_size: "30 ml",
      variant_shade: "Warm Beige",
      quantity: 1,
      unit_price: "3200.00",
      line_total: "3200.00",
    },
    {
      product_name: "Rose Water Toner",
      sku: "LUM-RWT-100",
      variant_size: "100 ml",
      variant_shade: "",
      quantity: 1,
      unit_price: "2050.00",
      line_total: "2050.00",
    },
  ],
};

export const dashboard: Dashboard = {
  orders_by_status: { pending: 4, confirmed: 2, shipped: 3, delivered: 40, cancelled: 1 },
  revenue: { today: "5400.00", last_7_days: "48200.00", last_30_days: "190350.00" },
  sales_by_day: Array.from({ length: 30 }, (_, index) => ({
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
    orders: index % 4,
    revenue: `${(index % 4) * 3200}.00`,
  })),
  recent_orders: [pendingOrder],
  low_stock: [
    {
      variant_id: "v1",
      product_id: "p1",
      product_name: "Silk Foundation",
      sku: "LUM-SF-30-WB",
      size: "30 ml",
      shade: "Warm Beige",
      stock_quantity: 2,
    },
  ],
};
