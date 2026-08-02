import { describe, expect, it, vi } from "vitest";

import packageJson from "./package.json";

// Cast to a loose shape: this test only cares about the mode-specific settings.
type WebServer = {
  command?: string;
  port?: number;
  reuseExistingServer?: boolean;
  env?: Record<string, string>;
};

type LooseConfig = {
  retries?: number;
  testDir?: string;
  testIgnore?: string[];
  webServer?: WebServer | WebServer[];
  use?: { baseURL?: string; extraHTTPHeaders?: Record<string, string> };
};

function asArray(server: WebServer | WebServer[] | undefined): WebServer[] {
  if (!server) return [];
  return Array.isArray(server) ? server : [server];
}

async function loadConfig(environment: Record<string, string>) {
  vi.resetModules();
  vi.unstubAllEnvs();

  for (const [name, value] of Object.entries(environment)) {
    vi.stubEnv(name, value);
  }

  return (await import("./playwright.config")).default as LooseConfig;
}

describe("playwright.config.ts", () => {
  it("uses the CI server settings for the smoke suite", async () => {
    const config = await loadConfig({ CI: "true", PLAYWRIGHT_AUTH: "" });
    const server = asArray(config.webServer)[0];

    expect(config.use?.baseURL).toBe("http://127.0.0.1:3000");
    expect(config.testDir).toBe("./tests");
    expect(config.testIgnore).toEqual(["auth/**", "real-auth/**"]);
    expect(config.retries).toBe(2);
    expect(server?.reuseExistingServer).toBe(false);
  });

  it("uses the local smoke settings outside CI", async () => {
    const config = await loadConfig({ CI: "", PLAYWRIGHT_AUTH: "" });

    expect(config.use?.baseURL).toBe("http://127.0.0.1:3001");
    expect(config.retries).toBe(0);
    expect(asArray(config.webServer)[0]?.reuseExistingServer).toBe(true);
  });

  it("uses the configured auth settings in auth mode", async () => {
    const config = await loadConfig({ CI: "true", PLAYWRIGHT_AUTH: "1" });
    const servers = asArray(config.webServer);
    const kratosServer = servers.find((server) => server.command?.includes("mock-kratos"));
    const appServer = servers.find((server) =>
      server.command?.includes(".next/standalone/server.js"),
    );

    expect(config.testDir).toBe("./tests/auth");
    expect(config.testIgnore).toEqual([]);
    expect(config.use?.baseURL).toBe("http://127.0.0.1:3002");
    expect(config.use?.extraHTTPHeaders).toEqual({
      "x-forwarded-host": "127.0.0.1:3002",
      "x-forwarded-proto": "http",
    });
    expect(kratosServer?.port).toBe(4010);
    expect(appServer?.port).toBe(3002);
    expect(appServer?.env?.NEXT_PUBLIC_ORY_SDK_URL).toBe(
      "http://127.0.0.1:4010",
    );
    expect(servers.every((server) => server.reuseExistingServer === false)).toBe(true);
  });

  it("uses an externally managed Kratos server in real auth mode", async () => {
    const config = await loadConfig({
      CI: "true",
      PLAYWRIGHT_AUTH: "1",
      PLAYWRIGHT_KRATOS_MODE: "real",
    });
    const servers = asArray(config.webServer);
    const appServer = servers.find((server) =>
      server.command?.includes(".next/standalone/server.js"),
    );
    const oidcServer = servers.find((server) => server.command?.includes("mock-oidc"));

    expect(config.testDir).toBe("./tests/real-auth");
    expect(config.testIgnore).toEqual([]);
    expect(servers).toHaveLength(2);
    expect(servers.some((server) => server.command?.includes("mock-kratos"))).toBe(false);
    expect(oidcServer?.port).toBe(4020);
    expect(appServer?.port).toBe(3002);
    expect(appServer?.env?.NEXT_PUBLIC_ORY_SDK_URL).toBe(
      "http://127.0.0.1:4010",
    );
    expect(appServer?.env?.NEXT_PUBLIC_ORY_OAUTH_ORIGINS).toBe(
      "http://127.0.0.1:4020",
    );
    expect(appServer?.env?.HOSTNAME).toBe("127.0.0.1");
    expect(appServer?.reuseExistingServer).toBe(false);
  });

  it("keeps the smoke mode isolated from configured auth servers", async () => {
    const config = await loadConfig({ CI: "", PLAYWRIGHT_AUTH: "" });
    const servers = asArray(config.webServer);

    expect(servers).toHaveLength(1);
    expect(servers.some((server) => server.command?.includes("mock-kratos"))).toBe(false);
    expect(servers[0]?.env?.NEXT_PUBLIC_ORY_SDK_URL).toBe("");
  });

  it("allows local test ports to be overridden", async () => {
    const config = await loadConfig({
      CI: "",
      PLAYWRIGHT_AUTH: "1",
      PLAYWRIGHT_APP_PORT: "3102",
      PLAYWRIGHT_KRATOS_PORT: "4110",
    });
    const servers = asArray(config.webServer);
    const appServer = servers.find((server) =>
      server.command?.includes(".next/standalone/server.js"),
    );

    expect(config.use?.baseURL).toBe("http://127.0.0.1:3102");
    expect(appServer?.port).toBe(3102);
    expect(servers[0]?.port).toBe(4110);
  });
});

describe("package.json", () => {
  it("wires the auth e2e script to the shared Playwright config", () => {
    expect(packageJson.scripts["test:e2e:auth"]).toBe(
      "node scripts/run-playwright-auth.mjs",
    );
  });
});
