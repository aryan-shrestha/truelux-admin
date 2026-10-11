import axios, { isAxiosError, type AxiosResponse } from "axios";

import { env } from "@/lib/env";

import { ApiError, toApiError } from "./errors";
import { clearSession, readSession, saveSession, TOKEN_PAIR_SCHEMA } from "./session";

declare module "axios" {
  interface AxiosRequestConfig {
    isRetry?: boolean;
  }
}

// A 401 from these is an answer about the credentials sent, not an expired access
// token, so they carry no bearer token and never trigger a refresh.
const TOKEN_PATHS = new Set(["auth/token/", "auth/token/refresh/"]);

// Every call goes straight to the API (ADR 0005). Paths are relative: "admin/products/".
export const httpClient = axios.create({
  baseURL: `${env.VITE_API_URL}/api/v1/`,
  headers: { Accept: "application/json" },
  // DRF reads a repeated filter as `status=a&status=b`; Axios would send `status[]=a`.
  paramsSerializer: { indexes: null },
});

httpClient.interceptors.request.use((config) => {
  const session = readSession();
  if (session !== null && !TOKEN_PATHS.has(config.url ?? "")) {
    config.headers.set("Authorization", `Bearer ${session.access}`);
  }
  return config;
});

let refreshing: Promise<boolean> | null = null;

// Refresh tokens rotate and the old one is blacklisted, so every request waiting in this
// tab shares one refresh: a second would send the token the first just rotated out.
// Resolves false when the API refused the refresh token; rejects when it was unreachable.
function refreshSession(refresh: string): Promise<boolean> {
  refreshing ??= httpClient
    .post("auth/token/refresh/", { refresh })
    .then((response) => {
      saveSession(TOKEN_PAIR_SCHEMA.parse(response.data));
      return true;
    })
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.code !== "network_error") return false;
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function endSession(): void {
  clearSession();
  const next = `${window.location.pathname}${window.location.search}`;
  // A full load rather than a router navigation, so the cached staff data goes too.
  window.location.assign(`/login?expired=1&next=${encodeURIComponent(next)}`);
}

async function recoverSession(error: unknown): Promise<AxiosResponse> {
  const apiError = toApiError(error);
  const config = isAxiosError(error) ? error.config : undefined;
  const sentAuthorization = config?.headers.get("Authorization");
  if (config === undefined || typeof sentAuthorization !== "string") throw apiError;

  if (apiError.status === 403 || (apiError.status === 401 && config.isRetry === true)) {
    endSession();
    throw apiError;
  }
  if (apiError.status !== 401) throw apiError;

  const session = readSession();
  if (session === null) {
    endSession();
    throw apiError;
  }
  // Another tab shares this storage and may already have stored a newer pair; only a
  // request that used the stored access token needs a refresh.
  if (sentAuthorization === `Bearer ${session.access}`) {
    const isRefreshed = await refreshSession(session.refresh);
    const latest = readSession();
    // A refused refresh is not the end if another tab rotated the pair meanwhile.
    if (!isRefreshed && (latest === null || latest.refresh === session.refresh)) {
      endSession();
      throw apiError;
    }
  }

  return httpClient.request({ ...config, isRetry: true });
}

httpClient.interceptors.response.use(undefined, recoverSession);
