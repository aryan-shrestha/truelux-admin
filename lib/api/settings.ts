import "server-only";

import { type Reader, apiRead, apiWrite } from "@/lib/api/client";
import type { ShippingSettings, ShippingSettingsUpdate } from "@/lib/api/types";

const SHIPPING_PATH = "/admin/settings/shipping/";

export async function getShippingSettings(read: Reader = apiRead): Promise<ShippingSettings> {
  return read<ShippingSettings>(SHIPPING_PATH);
}

export async function updateShippingSettings(
  body: ShippingSettingsUpdate,
): Promise<ShippingSettings> {
  return apiWrite<ShippingSettings>(SHIPPING_PATH, { method: "PATCH", body });
}
