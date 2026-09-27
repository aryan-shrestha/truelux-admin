import "server-only";

import { type Reader, apiRead } from "@/lib/api/client";
import type { Dashboard } from "@/lib/api/types";

export async function getDashboard(read: Reader = apiRead): Promise<Dashboard> {
  return read<Dashboard>("/admin/dashboard/");
}
