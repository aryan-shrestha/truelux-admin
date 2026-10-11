import type { Context } from "hono";

import { readAccessToken } from "./session.ts";

export const PROXY_PREFIX = "/bff/api/";

// Token endpoints are deliberately absent: their responses carry JWTs, which must
// never reach the browser (ADR 0001). The BFF calls them itself.
const ALLOWED_API_PATHS = ["/api/v1/admin/", "/api/v1/auth/me/"];

const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "x-request-id"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "x-request-id"];

function errorEnvelope(c: Context, status: 404 | 502, code: string, message: string) {
  return c.json({ error: { code, message, details: {} } }, status);
}

function resolveUpstreamUrl(requestUrl: string, apiUrl: string): URL | null {
  const incoming = new URL(requestUrl);
  const path = incoming.pathname.slice(PROXY_PREFIX.length);
  // Resolving through URL normalises "..", including percent-encoded dots, before the
  // allow-list check, so "admin/../auth/token/" cannot reach a token endpoint.
  const upstream = new URL(`api/v1/${path}`, new URL("/", apiUrl));
  upstream.search = incoming.search;
  const isAllowed = ALLOWED_API_PATHS.some((allowed) => upstream.pathname.startsWith(allowed));
  return isAllowed ? upstream : null;
}

export async function proxyToApi(c: Context, apiUrl: string): Promise<Response> {
  const upstreamUrl = resolveUpstreamUrl(c.req.url, apiUrl);
  if (upstreamUrl === null) {
    return errorEnvelope(c, 404, "not_found", "Not found.");
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = c.req.header(name);
    if (value !== undefined) headers.set(name, value);
  }
  const accessToken = readAccessToken(c);
  if (accessToken !== undefined) headers.set("authorization", `Bearer ${accessToken}`);

  const hasBody = c.req.method !== "GET" && c.req.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: c.req.method,
      headers,
      body: hasBody ? await c.req.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch {
    return errorEnvelope(c, 502, "bad_gateway", "The API could not be reached.");
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) responseHeaders.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
