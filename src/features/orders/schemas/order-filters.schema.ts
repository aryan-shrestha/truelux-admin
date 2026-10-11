import { z } from "zod";

import { ORDER_STATUS_SCHEMA, type OrderStatus } from "./order-status.schema";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Known statuses only, once each, in the API's order, so the same filters always make
// the same query key.
const STATUSES_SCHEMA = z
  .union([z.string(), z.array(z.string())])
  .transform((value): OrderStatus[] | undefined => {
    const requested = Array.isArray(value) ? value : [value];
    const statuses = ORDER_STATUS_SCHEMA.options.filter((status) => requested.includes(status));
    return statuses.length > 0 ? statuses : undefined;
  });

// Each field falls back on its own, so a hand-edited URL never breaks the page.
export const ORDER_FILTERS_SCHEMA = z.object({
  status: STATUSES_SCHEMA.optional().catch(undefined),
  q: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
    .catch(undefined),
  from: z.string().regex(ISO_DATE).optional().catch(undefined),
  to: z.string().regex(ISO_DATE).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export type OrderFilters = z.infer<typeof ORDER_FILTERS_SCHEMA>;
