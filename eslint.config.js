import js from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const DEEP_FEATURE_IMPORT = {
  group: ["@/features/*/*"],
  message: "Import another feature through its index.ts only (ADR 0003).",
};

const AXIOS_IMPORT = {
  name: "axios",
  message: "Only src/lib/repositories/ imports axios (ADR 0003).",
};

const HTTP_CLIENT_IMPORT = {
  group: ["@/lib/repositories/client"],
  message: "Only a feature's repositories/ folder calls the HTTP client (ADR 0003).",
};

const FEATURE_OR_ROUTE_IMPORT = {
  group: ["@/features/*", "@/routes/*"],
  message: "Shared code must not depend on features or routes (ADR 0003).",
};

export default defineConfig([
  globalIgnores([
    "dist",
    "src/components/ui",
    "src/hooks/use-mobile.ts",
    "src/routeTree.gen.ts",
    "playwright-report",
    "test-results",
    ".yarn",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
      pluginQuery.configs["flat/recommended"],
      pluginRouter.configs["flat/recommended"],
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-console": ["error", { allow: ["error"] }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "no-restricted-imports": [
        "error",
        { paths: [AXIOS_IMPORT], patterns: [DEEP_FEATURE_IMPORT, HTTP_CLIENT_IMPORT] },
      ],
    },
  },
  {
    files: ["src/routes/**/*.tsx"],
    rules: {
      // Route files export a `Route` object next to their component by design.
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["src/lib/repositories/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [FEATURE_OR_ROUTE_IMPORT] }],
    },
  },
  {
    files: ["src/features/*/repositories/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [AXIOS_IMPORT], patterns: [DEEP_FEATURE_IMPORT] },
      ],
    },
  },
  {
    files: ["src/lib/**", "src/components/**", "src/stores/**", "src/hooks/**", "src/config/**"],
    ignores: ["src/lib/repositories/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [AXIOS_IMPORT], patterns: [FEATURE_OR_ROUTE_IMPORT, HTTP_CLIENT_IMPORT] },
      ],
    },
  },
]);
