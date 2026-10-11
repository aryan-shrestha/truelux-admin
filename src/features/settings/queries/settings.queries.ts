import { queryOptions } from "@tanstack/react-query";

import { FRESHNESS } from "@/lib/freshness";

import { getShippingSettings } from "../repositories/shipping-settings.repository";

export const settingsKeys = {
  all: ["settings"] as const,
  shipping: () => [...settingsKeys.all, "shipping"] as const,
};

export const settingsQueries = {
  shipping: () =>
    queryOptions({
      queryKey: settingsKeys.shipping(),
      queryFn: getShippingSettings,
      ...FRESHNESS.reference,
    }),
};
