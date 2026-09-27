import "server-only";

import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

import { QUERY_DEFAULTS } from "@/lib/query/client";

export const getServerQueryClient = cache(
  () => new QueryClient({ defaultOptions: QUERY_DEFAULTS }),
);
