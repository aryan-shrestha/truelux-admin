import { Hono } from "hono";

import { PROXY_PREFIX, proxyToApi } from "./proxy.ts";

export function createApp({ apiUrl }: { apiUrl: string }): Hono {
  const app = new Hono();

  app.get("/bff/health", (c) => c.json({ status: "ok" }));
  app.all(`${PROXY_PREFIX}*`, (c) => proxyToApi(c, apiUrl));

  return app;
}
