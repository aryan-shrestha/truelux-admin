import type { NextRequest } from "next/server";

import { refreshTokens } from "@/lib/api/client";
import { emptyResponse, errorResponse } from "@/lib/api/route";
import { readSession, writeSession } from "@/lib/auth/session";

// A cookie-authenticated POST outside a server action gets no origin check from Next,
// so a cross-site form could otherwise rotate the session.
export async function POST(request: NextRequest): Promise<Response> {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return errorResponse(403, "permission_denied", "Cross-origin request refused.");
  }
  const { refresh } = await readSession();
  const tokens = refresh ? await refreshTokens(refresh).catch(() => null) : null;
  // The cookies are left alone on failure: another tab may have just rotated them, and
  // clearing them here would sign that tab out too.
  if (!tokens) {
    return errorResponse(401, "authentication_failed", "Sign in again.");
  }
  await writeSession(tokens);
  return emptyResponse();
}
