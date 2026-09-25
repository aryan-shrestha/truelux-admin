import { ORDER_STATUSES, type OrderQuery, type OrderStatus } from "@/lib/api/types";

export const ORDERS_PAGE_SIZE = 25;

type SearchParams = Record<string, string | string[] | undefined>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function all(value: string | string[] | undefined): string[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function first(value: string | string[] | undefined): string | undefined {
  return all(value)[0];
}

function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.some((status) => status === value);
}

export type OrderFilters = {
  status: OrderStatus[];
  q: string;
  from: string | undefined;
  to: string | undefined;
  page: number;
};

export function parseOrderFilters(params: SearchParams): OrderFilters {
  const from = first(params.from);
  const to = first(params.to);
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return {
    status: all(params.status).filter(isOrderStatus),
    q: first(params.q)?.trim() ?? "",
    from: from && ISO_DATE.test(from) ? from : undefined,
    to: to && ISO_DATE.test(to) ? to : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function toOrderQuery(filters: OrderFilters): OrderQuery {
  return {
    status: filters.status.length > 0 ? filters.status : undefined,
    search: filters.q || undefined,
    created_after: filters.from,
    created_before: filters.to,
    limit: ORDERS_PAGE_SIZE,
    offset: (filters.page - 1) * ORDERS_PAGE_SIZE,
  };
}

export function ordersHref(filters: Partial<OrderFilters>): string {
  const params = new URLSearchParams();
  for (const status of filters.status ?? []) params.append("status", status);
  if (filters.q) params.set("q", filters.q);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const search = params.toString();
  return search ? `/orders?${search}` : "/orders";
}
