import { z } from "zod";

const ENV_SCHEMA = z.object({
  API_URL: z.url({ protocol: /^https?$/ }),
});

export type ServerEnv = z.infer<typeof ENV_SCHEMA>;

export function readServerEnv(source: NodeJS.ProcessEnv): ServerEnv {
  const result = ENV_SCHEMA.safeParse(source);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Missing or invalid environment variables: ${names.join(", ")}`);
  }
  return result.data;
}
