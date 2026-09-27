import { ApiUnreachableError, toApiError } from "@/lib/api/errors";
import { type ApiQuery, toSearch } from "@/lib/search-params";

export const SESSION_PATH = "/api/session";

let refreshing: Promise<boolean> | null = null;

// One refresh per tab however many queries asked for it: a second refresh would send
// the refresh token the first one just rotated out, which the API has blacklisted.
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(SESSION_PATH, { method: "POST" })
    .then(
      (response) => response.ok,
      (cause: unknown) => {
        throw new ApiUnreachableError(cause);
      },
    )
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(url: string, signal: AbortSignal | undefined): Promise<Response> {
  return fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal }).catch(
    (cause: unknown) => {
      if (signal?.aborted) throw cause;
      throw new ApiUnreachableError(cause);
    },
  );
}

function endSession(): void {
  const next = `${window.location.pathname}${window.location.search}`;
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full load drops the cached staff data along with the session
  window.location.assign(`/login?expired=1&next=${encodeURIComponent(next)}`);
}

export async function getJson<T>(path: string, query?: ApiQuery, signal?: AbortSignal): Promise<T> {
  const url = `${path}${toSearch(query)}`;
  let response = await send(url, signal);
  if (response.status === 401) {
    const error = await toApiError(response);
    if (error.code !== "session_refresh_required" || !(await refreshSession())) {
      endSession();
      throw error;
    }
    response = await send(url, signal);
  }
  if (!response.ok) {
    const error = await toApiError(response);
    if (error.status === 401 || error.status === 403) endSession();
    throw error;
  }
  return (await response.json()) as T;
}
