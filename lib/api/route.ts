import "server-only";

import { NextResponse } from "next/server";

import { ApiError, ApiUnreachableError } from "@/lib/api/errors";

// Staff data is private and must be current; no browser or CDN may keep a copy.
const NO_STORE = { "Cache-Control": "private, no-store" };

// The same envelope the API sends, so the browser parses it with `toApiError`.
export function errorResponse(
  status: number,
  code: string,
  message: string,
  { details = {}, requestId = null }: { details?: object; requestId?: string | null } = {},
): NextResponse {
  const headers: Record<string, string> = { ...NO_STORE };
  if (requestId) headers["X-Request-ID"] = requestId;
  return NextResponse.json({ error: { code, message, details } }, { status, headers });
}

export async function respond<T>(work: () => Promise<T>): Promise<Response> {
  try {
    return Response.json(await work(), { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.status, error.code, error.message, {
        details: error.details,
        requestId: error.requestId,
      });
    }
    if (error instanceof ApiUnreachableError) {
      console.error("API unreachable", error.cause);
      return errorResponse(502, "api_unreachable", error.message);
    }
    throw error;
  }
}

export function emptyResponse(): Response {
  return new Response(null, { status: 204, headers: NO_STORE });
}
