import { z } from "zod";

export const SHIPPING_SETTINGS_SCHEMA = z.object({
  inside_valley_fee: z.string(),
  outside_valley_fee: z.string(),
  free_shipping_threshold: z.string().nullable(),
  updated_at: z.iso.datetime({ offset: true }),
});

export type ShippingSettings = z.infer<typeof SHIPPING_SETTINGS_SCHEMA>;
