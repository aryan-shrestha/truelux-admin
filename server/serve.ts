import { serve } from "@hono/node-server";

import { createApp } from "./app.ts";
import { readServerEnv } from "./env.ts";

// Development entry point. Vite proxies /bff here (vite.config.ts).
const BFF_DEV_PORT = 8787;

const env = readServerEnv(process.env);

serve({ fetch: createApp({ apiUrl: env.API_URL }).fetch, port: BFF_DEV_PORT });
