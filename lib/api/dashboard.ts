import "server-only";

import { apiRead } from "@/lib/api/client";
import type { Dashboard } from "@/lib/api/types";

export async function getDashboard(): Promise<Dashboard> {
  return apiRead<Dashboard>("/admin/dashboard/");
}
