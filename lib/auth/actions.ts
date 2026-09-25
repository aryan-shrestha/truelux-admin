"use server";

import { redirect } from "next/navigation";

import { type ActionFailure, attempt, invalidInput } from "@/lib/actions/attempt";
import { logout, obtainTokens } from "@/lib/api/auth";
import { LOGIN_PATH } from "@/lib/api/client";
import { type LoginInput, loginSchema } from "@/lib/auth/login-schema";
import { safeNextPath } from "@/lib/auth/next-path";
import { clearSession, readSession, writeSession } from "@/lib/auth/session";

export async function signIn(input: LoginInput, next: string | null): Promise<ActionFailure> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ...invalidInput(), message: "Enter your email and password." };
  }

  const result = await attempt(() => obtainTokens(parsed.data));
  if (!result.ok) {
    // The API answers a wrong password, an unknown email and a non-staff account
    // identically; the message must not tell them apart either.
    return result.code === "authentication_failed"
      ? { ...result, message: "Email or password is incorrect." }
      : result;
  }

  await writeSession(result.data);
  redirect(safeNextPath(next));
}

export async function signOut(): Promise<void> {
  const { refresh } = await readSession();
  if (refresh) {
    // A 422 invalid_refresh_token means the token is already unusable; either way the
    // cookies go, so the outcome of the call does not change what happens next.
    await attempt(() => logout({ refresh }));
  }
  await clearSession();
  redirect(LOGIN_PATH);
}
