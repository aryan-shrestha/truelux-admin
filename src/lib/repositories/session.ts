import { z } from "zod";

// Every read and write of the staff tokens goes through here (ADR 0005). Anything that
// can read them can act as the signed-in staff member, so only the HTTP client and the
// auth repository call these functions; everything else asks hasSession().
const SESSION_KEY = "truelux-admin-session";

export const TOKEN_PAIR_SCHEMA = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
});

export type TokenPair = z.infer<typeof TOKEN_PAIR_SCHEMA>;

export function readSession(): TokenPair | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored === null) return null;
    const result = TOKEN_PAIR_SCHEMA.safeParse(JSON.parse(stored));
    return result.success ? result.data : null;
  } catch {
    // Blocked storage (private mode, disabled site data) or a value that is not JSON.
    return null;
  }
}

export function hasSession(): boolean {
  return readSession() !== null;
}

export function saveSession(pair: TokenPair): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(pair));
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Blocked storage holds no session to clear.
  }
}
