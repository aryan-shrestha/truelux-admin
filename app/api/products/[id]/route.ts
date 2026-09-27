import { apiGet } from "@/lib/api/client";
import { getProduct } from "@/lib/api/products";
import { respond } from "@/lib/api/route";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/products/[id]">,
): Promise<Response> {
  const { id } = await params;
  return respond(() => getProduct({ id }, apiGet));
}
