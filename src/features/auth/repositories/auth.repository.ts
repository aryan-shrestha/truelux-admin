import { httpClient } from "@/lib/repositories/client";
import {
  clearSession,
  readSession,
  saveSession,
  TOKEN_PAIR_SCHEMA,
} from "@/lib/repositories/session";

import type { LoginFormValues } from "../schemas/login.schema";
import { STAFF_USER_SCHEMA, type StaffUser } from "../schemas/staff-user.schema";

export async function signIn(input: LoginFormValues): Promise<void> {
  const response = await httpClient.post("auth/token/", input);
  saveSession(TOKEN_PAIR_SCHEMA.parse(response.data));
}

export async function signOut(): Promise<void> {
  const session = readSession();
  try {
    if (session !== null) await httpClient.post("auth/logout/", { refresh: session.refresh });
  } catch {
    // Signing out never fails for staff: a 422 means the refresh token was already dead,
    // and an unreachable API still leaves this browser without the tokens.
  } finally {
    clearSession();
  }
}

export async function getMe(): Promise<StaffUser> {
  const response = await httpClient.get("auth/me/");
  return STAFF_USER_SCHEMA.parse(response.data);
}
