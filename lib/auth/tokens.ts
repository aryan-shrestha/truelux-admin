export const ACCESS_COOKIE = "tl_access";
export const REFRESH_COOKIE = "tl_refresh";

type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

function expiryOf(jwt: string): number | null {
  const payload = jwt.split(".")[1];
  if (!payload) {
    return null;
  }
  try {
    const claims: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof claims === "object" && claims !== null && "exp" in claims) {
      return typeof claims.exp === "number" ? claims.exp : null;
    }
    return null;
  } catch {
    return null;
  }
}

// The signature is not verified here: the API verifies every token it receives. The
// expiry only sizes the cookie and decides when to refresh ahead of time.
export function secondsUntilExpiry(jwt: string, now: number = Date.now()): number {
  const exp = expiryOf(jwt);
  return exp === null ? 0 : Math.max(0, Math.floor(exp - now / 1000));
}

export function cookieOptions(jwt: string, now?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: secondsUntilExpiry(jwt, now),
  };
}
