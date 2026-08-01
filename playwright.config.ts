import { defineConfig, devices } from "@playwright/test";

const isAuthMode = process.env.PLAYWRIGHT_AUTH === "1";
const isRealKratosMode =
  isAuthMode && process.env.PLAYWRIGHT_KRATOS_MODE === "real";
const PORT = Number(
  process.env.PLAYWRIGHT_APP_PORT ?? (isAuthMode ? 3002 : process.env.CI ? 3000 : 3001),
);
const KRATOS_PORT = Number(process.env.PLAYWRIGHT_KRATOS_PORT ?? 4010);
const appServer = {
  command: `pnpm build && node scripts/prepare-standalone.mjs && node .next/standalone/server.js`,
  port: PORT,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  env: {
    HOSTNAME: "127.0.0.1",
    PORT: PORT.toString(),
    NEXT_PUBLIC_BRAND_NAME: "CI",
    NEXT_PUBLIC_BRAND_MARK: "C",
    NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${PORT}`,
    NEXT_PUBLIC_ORY_SDK_URL: isAuthMode ? `http://127.0.0.1:${KRATOS_PORT}` : "",
    ORY_SDK_URL: "",
    NEXT_PUBLIC_ORY_PROJECT_NAME: "CI",
    ORY_PROJECT_API_TOKEN: "",
    NEXT_TELEMETRY_DISABLED: "1",
    NODE_ENV: "production",
  },
};

export default defineConfig({
  testDir: isAuthMode
    ? isRealKratosMode
      ? "./tests/real-auth"
      : "./tests/auth"
    : "./tests",
  testIgnore: isAuthMode ? [] : ["auth/**", "real-auth/**"],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  timeout: process.env.CI ? 30_000 : 15_000,

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...(isAuthMode
      ? {
          extraHTTPHeaders: {
            "x-forwarded-host": `127.0.0.1:${PORT}`,
            "x-forwarded-proto": "http",
          },
        }
      : {}),
    trace: process.env.CI ? "on-first-retry" : "off",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: isAuthMode
    ? [
        ...(isRealKratosMode
          ? []
          : [
              {
                command: "node scripts/mock-kratos.mjs",
                port: KRATOS_PORT,
                reuseExistingServer: !process.env.CI,
                timeout: 30_000,
                env: { PORT: KRATOS_PORT.toString() },
              },
            ]),
        appServer,
      ]
    : [appServer],
});
