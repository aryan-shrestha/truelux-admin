import { defineConfig, devices } from "@playwright/test";

const PORT = 3001;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // The admin calls the API only from its server, where page.route cannot reach, so
  // the specs need a live backend and are skipped unless E2E_API is set.
  webServer: process.env.E2E_API
    ? {
        command: "yarn dev",
        url: `http://localhost:${PORT}/login`,
        reuseExistingServer: !process.env.CI,
        env: { API_BASE_URL: process.env.E2E_API },
      }
    : undefined,
});
