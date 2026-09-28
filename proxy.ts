import { NextResponse, type NextRequest } from "next/server";

import { refreshTokens } from "@/lib/api/client";
import { errorResponse } from "@/lib/api/route";
import { safeNextPath } from "@/lib/auth/next-path";
import { SESSION_PATH } from "@/lib/query/get-json";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  secondsUntilExpiry,
} from "@/lib/auth/tokens";

const REFRESH_MARGIN_SECONDS = 60;

function redirectToLogin(request: NextRequest, reason?: "expired"): NextResponse {
  const url = new URL("/login", request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next !== "/") {
    url.searchParams.set("next", next);
  }
  if (reason) {
    url.searchParams.set(reason, "1");
  }
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  const isApi = pathname.startsWith("/api/");

  if (!refresh) {
    if (isApi) {
      return errorResponse(401, "authentication_failed", "Sign in again.");
    }
    return isLogin ? NextResponse.next() : redirectToLogin(request);
  }

  if (isLogin) {
    // An expired session keeps its cookies until the next sign-in overwrites them;
    // bouncing it back would loop between here and the page that sent it.
    if (request.nextUrl.searchParams.has("expired")) {
      return NextResponse.next();
    }
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const isFresh = access !== undefined && secondsUntilExpiry(access) > REFRESH_MARGIN_SECONDS;
  if (isFresh || pathname === SESSION_PATH) {
    return NextResponse.next();
  }

  // Refresh tokens rotate and are blacklisted, so parallel background fetches that each
  // refreshed here would race and sign the user out. The browser refreshes once
  // through SESSION_PATH and retries.
  if (isApi) {
    return errorResponse(401, "session_refresh_required", "The session needs refreshing.");
  }

  // Server Components cannot set cookies, so the renewal happens here, before the
  // render, and the new pair is forwarded on the request as well as the response.
  const tokens = await refreshTokens(refresh).catch(() => null);
  if (!tokens) {
    return redirectToLogin(request, "expired");
  }

  request.cookies.set(ACCESS_COOKIE, tokens.access);
  request.cookies.set(REFRESH_COOKIE, tokens.refresh);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(ACCESS_COOKIE, tokens.access, cookieOptions(tokens.access));
  response.cookies.set(REFRESH_COOKIE, tokens.refresh, cookieOptions(tokens.refresh));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|ico|webp)$).*)"],
};
