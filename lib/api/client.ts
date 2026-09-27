import "server-only";

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

function buildUrl(path: string, query: Query | undefined): string {
  return `${env.apiBaseUrl}/api/v1${path}${toSearch(query)}`;
}

async function send(path: string, options: SendOptions): Promise<Response> {
  // Django redirects a path without its trailing slash, and the redirect turns a
  // POST into a GET.
  if (!path.endsWith("/")) {
    throw new Error(`API paths end in a slash: ${path}`);
  }
  const headers = new Headers({ Accept: "application/json" });
  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiUnreachableError(cause);
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function publicRequest<T>(
  path: string,
  options: Omit<SendOptions, "accessToken">,
): Promise<T> {
  return parse<T>(await send(path, options));
}

export async function refreshTokens(refresh: string): Promise<TokenPair | null> {
  const response = await send("/auth/token/refresh/", { method: "POST", body: { refresh } });
  return response.ok ? ((await response.json()) as TokenPair) : null;
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
