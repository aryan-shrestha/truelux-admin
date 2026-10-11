import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["src/test/setup.ts"],
      // The page and the API share an origin in tests, so jsdom sends no CORS
      // preflight; answering CORS is the real API's job (ADR 0005).
      environmentOptions: { jsdom: { url: "http://admin.test" } },
      env: { VITE_API_URL: "http://admin.test" },
    },
  }),
);
