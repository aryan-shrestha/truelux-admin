import type { QueryKey } from "@tanstack/react-query";

import type { TaxonomyKind } from "@/lib/api/types";
import { dashboardKeys } from "@/lib/dashboard/queries";
import { orderKeys } from "@/lib/orders/queries";
import { productKeys } from "@/lib/products/queries";
import { settingsKeys } from "@/lib/settings/queries";
import { taxonomyKeys } from "@/lib/taxonomy/queries";

// What each change the admin makes leaves stale. Queries not on screen are only marked
// stale and refetch when shown again. A missing key here shows old data until the
// query's freshness class catches up.

// Products show brand, category, size, shade and skin type names.
export function afterTaxonomyChange(kind: TaxonomyKind): QueryKey[] {
  return [taxonomyKeys.kind(kind), productKeys.all];
}

// A list row shows the product's image, prices and stock; the taxonomy lists count
// products and variants.
export function afterProductChange(id: string): QueryKey[] {
  return [productKeys.detail(id), productKeys.lists(), taxonomyKeys.all];
}

export function afterProductCreate(): QueryKey[] {
  return [productKeys.lists(), taxonomyKeys.all];
}

// Stock also feeds the dashboard's low-stock list.
export function afterVariantChange(productId: string): QueryKey[] {
  return [...afterProductChange(productId), dashboardKeys.all];
}

export function afterImageChange(productId: string): QueryKey[] {
  return [productKeys.detail(productId), productKeys.lists()];
}

// A cancel puts the items back into stock.
export function afterOrderMove(): QueryKey[] {
  return [orderKeys.lists(), dashboardKeys.all, productKeys.all];
}

export function afterSettingsChange(): QueryKey[] {
  return [settingsKeys.shipping()];
}
