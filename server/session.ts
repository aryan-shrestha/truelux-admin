import type { Context } from "hono";
import { getCookie } from "hono/cookie";

// The __Host- prefix makes the browser refuse the cookie unless it is Secure, has
// Path=/ and no Domain, so no subdomain or plain-HTTP page can plant or read it.
export const ACCESS_COOKIE = "__Host-truelux_access";

export function readAccessToken(c: Context): string | undefined {
  return getCookie(c, ACCESS_COOKIE);
}
