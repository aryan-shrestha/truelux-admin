import { z } from "zod";

const schema = z.object({
  API_BASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_BRAND_NAME: z.string().trim().min(1),
});

// Each name is a literal `process.env.X`: Next inlines NEXT_PUBLIC_* by static analysis.
const parsed = schema.safeParse({
  API_BASE_URL: process.env.API_BASE_URL,
  NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment.\n${z.prettifyError(parsed.error)}\n` +
      "Locally, copy .env.example to .env.local. On Vercel, set the variable for this environment and redeploy.",
  );
}

export const env = {
  apiBaseUrl: parsed.data.API_BASE_URL.replace(/\/+$/, ""),
  brandName: parsed.data.NEXT_PUBLIC_BRAND_NAME,
} as const;
