import { apiGet } from "@/lib/api/client";
import { respond } from "@/lib/api/route";
import { getShippingSettings } from "@/lib/api/settings";

export function GET(): Promise<Response> {
  return respond(() => getShippingSettings(apiGet));
}
