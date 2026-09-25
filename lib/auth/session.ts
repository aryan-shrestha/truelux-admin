import "server-only";

import { cookies } from "next/headers";

import type { TokenPair } from "@/lib/api/types";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/auth/tokens";

export async function readSession(): Promise<Partial<TokenPair>> {
  const store = await cookies();
  return {
    access: store.get(ACCESS_COOKIE)?.value,
    refresh: store.get(REFRESH_COOKIE)?.value,
  };
}

export async function writeSession(tokens: TokenPair): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.access, cookieOptions(tokens.access));
  store.set(REFRESH_COOKIE, tokens.refresh, cookieOptions(tokens.refresh));
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
