import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${resolve(import.meta.dirname, ".")}/` },
      // The real package throws outside a React Server bundle; Next swaps it for an
      // empty module on the server, and the suite runs lib/api the same way.
      { find: /^server-only$/, replacement: resolve(import.meta.dirname, "tests/server-only.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    env: {
      API_BASE_URL: "http://api.test",
      NEXT_PUBLIC_BRAND_NAME: "TrueLux",
    },
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
  },
});
