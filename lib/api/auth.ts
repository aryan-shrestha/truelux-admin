import "server-only";

import { apiRead, apiWrite, publicRequest } from "@/lib/api/client";
import type { StaffUser, TokenPair } from "@/lib/api/types";

export async function obtainTokens(credentials: {
  email: string;
  password: string;
}): Promise<TokenPair> {
  return publicRequest<TokenPair>("/auth/token/", { method: "POST", body: credentials });
}

export async function logout({ refresh }: { refresh: string }): Promise<void> {
  return apiWrite<void>("/auth/logout/", { method: "POST", body: { refresh } });
}

export async function getMe(): Promise<StaffUser> {
  return apiRead<StaffUser>("/auth/me/");
}
