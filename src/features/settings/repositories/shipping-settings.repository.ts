import { httpClient } from "@/lib/repositories/client";

import {
  SHIPPING_SETTINGS_SCHEMA,
  type ShippingSettings,
} from "../schemas/shipping-settings.schema";

export async function getShippingSettings(): Promise<ShippingSettings> {
  const response = await httpClient.get("admin/settings/shipping/");
  return SHIPPING_SETTINGS_SCHEMA.parse(response.data);
}

export async function updateShippingSettings(body: object): Promise<ShippingSettings> {
  const response = await httpClient.patch("admin/settings/shipping/", body);
  return SHIPPING_SETTINGS_SCHEMA.parse(response.data);
}
