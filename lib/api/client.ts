import "server-only";

import axios, { type AxiosResponse } from "axios";
import { redirect } from "next/navigation";

import { ApiUnreachableError, toApiError } from "@/lib/api/errors";
import type { TokenPair } from "@/lib/api/types";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { type ApiQuery as Query, toSearch } from "@/lib/search-params";

type Body = FormData | object;

type SendOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Query;
  body?: Body;
  accessToken?: string;
};

export const LOGIN_PATH = "/login";
const EXPIRED_LOGIN_PATH = "/login?expired=1";

// The fetch adapter keeps Next's patched fetch (and `cache: "no-store"`) and runs in the
// proxy. Every status resolves: the admin branches on the envelope's `code`, so an
// axios error only ever means the request never got an answer.
const api = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  adapter: "fetch",
  fetchOptions: { cache: "no-store" },
  headers: { Accept: "application/json" },
  paramsSerializer: { serialize: (params: Query) => toSearch(params).slice(1) },
  validateStatus: () => true,
});

function isOk(response: AxiosResponse): boolean {
  return response.status >= 200 && response.status < 300;
}

async function send(path: string, options: SendOptions): Promise<AxiosResponse> {
  // Django redirects a path without its trailing slash, and the redirect turns a
  // POST into a GET.
  if (!path.endsWith("/")) {
    throw new Error(`API paths end in a slash: ${path}`);
  }
  return api
    .request({
      url: path,
      method: options.method,
      params: options.query,
      data: options.body,
      headers: {
        // On the server axios keeps its url-encoded default for Node's FormData, and fetch
        // sends the multipart body under that header. The fetch adapter drops a multipart
        // type without a boundary, so fetch sets `multipart/form-data; boundary=…` itself.
        ...(options.body instanceof FormData && { "Content-Type": "multipart/form-data" }),
        ...(options.accessToken && { Authorization: `Bearer ${options.accessToken}` }),
      },
    })
    .catch((cause: unknown) => {
      if (axios.isAxiosError(cause)) throw new ApiUnreachableError(cause);
      throw cause;
    });
}

function parse<T>(response: AxiosResponse): T {
  if (!isOk(response)) {
    throw toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.data as T;
}

export async function publicRequest<T>(
  path: string,
  options: Omit<SendOptions, "accessToken">,
): Promise<T> {
  return parse<T>(await send(path, options));
}

export async function refreshTokens(refresh: string): Promise<TokenPair | null> {
  const response = await send("/auth/token/refresh/", { method: "POST", body: { refresh } });
  return isOk(response) ? (response.data as TokenPair) : null;
}

// Server Components cannot write cookies, so a read never refreshes: proxy.ts renews the
// access token before any render. A 401 here means the session is gone; a 403 means the
// account lost staff rights, which an access token keeps passing authentication for until
// it expires.
export type Reader = <T>(path: string, query?: Query) => Promise<T>;

export const apiRead: Reader = async <T>(path: string, query?: Query): Promise<T> => {
  const { access } = await readSession();
  const response = await send(path, { method: "GET", query, accessToken: access });
  if (response.status === 401 || response.status === 403) {
    redirect(EXPIRED_LOGIN_PATH);
  }
  return parse<T>(response);
};

// A Route Handler answers a browser fetch, which would follow a redirect to the login
// page's HTML. It passes a 401 or 403 on as an error for the browser to act on.
export const apiGet: Reader = async <T>(path: string, query?: Query): Promise<T> => {
  const { access } = await readSession();
  return parse<T>(await send(path, { method: "GET", query, accessToken: access }));
};

export async function apiWrite<T>(
  path: string,
  options: { method: "POST" | "PATCH" | "DELETE"; body?: Body },
): Promise<T> {
  const session = await readSession();
  const first = await send(path, { ...options, accessToken: session.access });
  if (first.status !== 401) {
    return parse<T>(first);
  }

  const tokens = session.refresh ? await refreshTokens(session.refresh) : null;
  if (!tokens) {
    await clearSession();
    redirect(LOGIN_PATH);
  }
  await writeSession(tokens);
  return parse<T>(await send(path, { ...options, accessToken: tokens.access }));
}
