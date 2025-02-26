import { defineConfig, devices } from "@playwright/test";
import { E2E_DATABASE_URL } from "./e2e/prepare-db";

// An uncommon port, and never reuse an already-running server: another local
// app listening on a shared port once answered the tests instead of Taleverse.
const PORT = Number(process.env.E2E_PORT ?? 47213);

/**
 * End-to-end tests run the real app (next dev) against its own database, with
 * dev login switched on so each test can pick a persona via a cookie.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1, // tests share one database and the dev accounts
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm tsx e2e/prepare-db.ts && pnpm next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { DATABASE_URL: E2E_DATABASE_URL, DEV_AS: "reader", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
