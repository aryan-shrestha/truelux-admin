"use server";

import { type ActionResult, attempt, invalidInput } from "@/lib/actions/attempt";
import { updateShippingSettings } from "@/lib/api/settings";
import type { ShippingSettings } from "@/lib/api/types";
import { type ShippingSettingsValues, shippingSettingsSchema } from "@/lib/settings/schemas";

export async function saveShippingSettings(
  input: ShippingSettingsValues,
): Promise<ActionResult<ShippingSettings>> {
  const parsed = shippingSettingsSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const { inside_valley_fee, outside_valley_fee, has_free_shipping, free_shipping_threshold } =
    parsed.data;
  return attempt(() =>
    updateShippingSettings({
      inside_valley_fee,
      outside_valley_fee,
      free_shipping_threshold: has_free_shipping ? free_shipping_threshold : null,
    }),
  );
}
