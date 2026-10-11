import { z } from "zod";

const ENV_SCHEMA = z.object({
  VITE_API_URL: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, "")),
});

export type Env = z.infer<typeof ENV_SCHEMA>;

export function readEnv(source: Record<string, unknown>): Env {
  const result = ENV_SCHEMA.safeParse(source);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Missing or invalid environment variables: ${names.join(", ")}`);
  }
  return result.data;
}

export const env = readEnv(import.meta.env);
