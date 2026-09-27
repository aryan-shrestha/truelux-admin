import { apiGet } from "@/lib/api/client";
import { getDashboard } from "@/lib/api/dashboard";
import { respond } from "@/lib/api/route";

export function GET(): Promise<Response> {
  return respond(() => getDashboard(apiGet));
}
