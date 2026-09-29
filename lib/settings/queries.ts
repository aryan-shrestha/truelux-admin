import { queryOptions } from "@tanstack/react-query";

import type { ShippingSettings } from "@/lib/api/types";
import { FRESHNESS } from "@/lib/query/client";
import { getJson } from "@/lib/query/get-json";

export const settingsKeys = {
  all: ["settings"] as const,
  shipping: () => [...settingsKeys.all, "shipping"] as const,
};

export const shippingSettingsQuery = queryOptions({
  queryKey: settingsKeys.shipping(),
  queryFn: ({ signal }) => getJson<ShippingSettings>("/api/settings/shipping", undefined, signal),
  ...FRESHNESS.reference,
});
