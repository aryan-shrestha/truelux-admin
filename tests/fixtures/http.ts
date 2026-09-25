export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function errorResponse(status: number, code: string, details: object = {}): Response {
  return jsonResponse({ error: { code, message: `server says ${code}`, details } }, status, {
    "X-Request-ID": "req-123",
  });
}
