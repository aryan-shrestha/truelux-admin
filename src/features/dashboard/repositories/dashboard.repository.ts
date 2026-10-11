import { httpClient } from "@/lib/repositories/client";

import { DASHBOARD_SCHEMA, type Dashboard } from "../schemas/dashboard.schema";

export async function getDashboard(): Promise<Dashboard> {
  const response = await httpClient.get("admin/dashboard/");
  return DASHBOARD_SCHEMA.parse(response.data);
}
