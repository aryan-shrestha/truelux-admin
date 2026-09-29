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

type FetchMock = { mock: { calls: Parameters<typeof fetch>[] } };

// axios's fetch adapter hands fetch one `Request` (plus `{ cache }` as init), so a test
// reads the URL, method, headers and body from it.
export function sentRequest(fetchMock: FetchMock, call = 0): Request {
  const [input, init] = fetchMock.mock.calls[call] ?? [];
  if (input === undefined) {
    throw new Error(`fetch was called fewer than ${call + 1} times`);
  }
  return input instanceof Request ? input : new Request(input, init);
}

export function sentPath(fetchMock: FetchMock, call = 0): string {
  const url = new URL(sentRequest(fetchMock, call).url);
  return `${url.pathname}${url.search}`;
}
