import { apiGet } from "@/lib/api/client";
import { getOrder } from "@/lib/api/orders";
import { respond } from "@/lib/api/route";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/orders/[id]">,
): Promise<Response> {
  const { id } = await params;
  return respond(() => getOrder({ id }, apiGet));
}
