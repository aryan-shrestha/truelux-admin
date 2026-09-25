const FALLBACK = "/";

// Only a same-origin path may follow sign-in. "//host" and "/\host" are
// protocol-relative to browsers, so both are rejected along with absolute URLs.
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return FALLBACK;
  }
  if (/[\u0000-\u001f\\]/.test(value)) {
    return FALLBACK;
  }
  const url = new URL(value, "http://admin.invalid");
  if (
    url.origin !== "http://admin.invalid" ||
    url.pathname.startsWith("//") ||
    url.pathname === "/login"
  ) {
    return FALLBACK;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
