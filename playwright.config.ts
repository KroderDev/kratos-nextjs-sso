import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.CI ? 3000 : 3001;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  timeout: process.env.CI ? 30_000 : 15_000,

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: process.env.CI ? "on-first-retry" : "off",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: `pnpm build && node scripts/prepare-standalone.mjs && node .next/standalone/server.js`,
      port: PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: PORT.toString(),
        NEXT_PUBLIC_BRAND_NAME: "CI",
        NEXT_PUBLIC_BRAND_MARK: "C",
        NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${PORT}`,
        NEXT_PUBLIC_ORY_SDK_URL: "",
        ORY_SDK_URL: "",
        NEXT_PUBLIC_ORY_PROJECT_NAME: "CI",
        ORY_PROJECT_API_TOKEN: "",
        NEXT_TELEMETRY_DISABLED: "1",
        NODE_ENV: "production",
      },
    },
  ],
});
