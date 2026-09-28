import axios, { type AxiosResponse } from "axios";

import { ApiUnreachableError, toApiError } from "@/lib/api/errors";
import { type ApiQuery, toSearch } from "@/lib/search-params";

export const SESSION_PATH = "/api/session";

// Every status resolves, as in lib/api/client.ts: the admin branches on the envelope's
// `code`, so an axios error means no answer at all.
const http = axios.create({
  adapter: "fetch",
  fetchOptions: { cache: "no-store" },
  headers: { Accept: "application/json" },
  paramsSerializer: { serialize: (params: ApiQuery) => toSearch(params).slice(1) },
  validateStatus: () => true,
});

function isOk(response: AxiosResponse): boolean {
  return response.status >= 200 && response.status < 300;
}

// The fetch adapter builds a `Request`, which needs an absolute URL outside a browser
// (under jsdom); in the browser the origin is the same either way.
function origin(): string {
  return window.location.origin;
}

function unreachable(cause: unknown): never {
  // A cancel is TanStack aborting a query it no longer needs, not a failure to report.
  if (axios.isCancel(cause) || !axios.isAxiosError(cause)) throw cause;
  throw new ApiUnreachableError(cause);
}

let refreshing: Promise<boolean> | null = null;

// One refresh per tab however many queries asked for it: a second refresh would send
// the refresh token the first one just rotated out, which the API has blacklisted.
function refreshSession(): Promise<boolean> {
  refreshing ??= http
    .post(SESSION_PATH, undefined, { baseURL: origin() })
    .then(isOk, unreachable)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function send(path: string, query: ApiQuery | undefined, signal: AbortSignal | undefined) {
  return http.get(path, { baseURL: origin(), params: query, signal }).catch(unreachable);
}

function endSession(): void {
  const next = `${window.location.pathname}${window.location.search}`;
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full load drops the cached staff data along with the session
  window.location.assign(`/login?expired=1&next=${encodeURIComponent(next)}`);
}

export async function getJson<T>(path: string, query?: ApiQuery, signal?: AbortSignal): Promise<T> {
  let response = await send(path, query, signal);
  if (response.status === 401) {
    const error = toApiError(response);
    if (error.code !== "session_refresh_required" || !(await refreshSession())) {
      endSession();
      throw error;
    }
    response = await send(path, query, signal);
  }
  if (!isOk(response)) {
    const error = toApiError(response);
    if (error.status === 401 || error.status === 403) endSession();
    throw error;
  }
  return response.data as T;
}
