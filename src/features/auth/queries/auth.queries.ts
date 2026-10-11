import { queryOptions } from "@tanstack/react-query";

import { FRESHNESS } from "@/lib/freshness";

import { getMe } from "../repositories/auth.repository";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const authQueries = {
  me: () => queryOptions({ queryKey: authKeys.me(), queryFn: getMe, ...FRESHNESS.reference }),
};
