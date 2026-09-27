import { ORDER_STATUSES, type OrderQuery, type OrderStatus } from "@/lib/api/types";
import {
  type SearchParams,
  allParams,
  firstParam,
  pageParam,
  queryParam,
} from "@/lib/search-params";

export const ORDERS_PAGE_SIZE = 25;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type OrderFilters = {
  status: OrderStatus[];
  q: string;
  from: string | undefined;
  to: string | undefined;
  page: number;
};

export function parseOrderFilters(params: SearchParams): OrderFilters {
  const from = firstParam(params.from);
  const to = firstParam(params.to);
  const statuses = allParams(params.status);
  return {
    // In the API's order and once each, so equal filters make one query key.
    status: ORDER_STATUSES.filter((status) => statuses.includes(status)),
    q: queryParam(params),
    from: from && ISO_DATE.test(from) ? from : undefined,
    to: to && ISO_DATE.test(to) ? to : undefined,
    page: pageParam(params),
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
