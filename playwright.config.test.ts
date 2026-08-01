import { describe, expect, it } from "vitest";

import packageJson from "./package.json";

// Cast to a loose shape: these are Playwright config objects, and this test
// only cares about a handful of fields relevant to the auth-config split.
type WebServer = {
  command?: string;
  port?: number;
  env?: Record<string, string>;
};
type LooseConfig = {
  testDir?: string;
  testIgnore?: string[];
  webServer?: WebServer | WebServer[];
  use?: { baseURL?: string; extraHTTPHeaders?: Record<string, string> };
};

import authConfigDefault from "./playwright.auth.config";
import smokeConfigDefault from "./playwright.config";

const authConfig = authConfigDefault as LooseConfig;
const smokeConfig = smokeConfigDefault as LooseConfig;

function asArray(server: WebServer | WebServer[] | undefined): WebServer[] {
  if (!server) return [];
  return Array.isArray(server) ? server : [server];
}

describe("playwright.config.ts", () => {
  it("ignores the auth test suite, which runs under its own config", () => {
    expect(smokeConfig.testIgnore).toEqual(["auth/**"]);
  });

  it("runs a single app web server on a port distinct from the auth app server", () => {
    const servers = asArray(smokeConfig.webServer);
    expect(servers).toHaveLength(1);

    const smokeAppPort = Number(servers[0]?.env?.PORT);
    const authServers = asArray(authConfig.webServer);
    const authAppServer = authServers.find((server) => server.env?.NEXT_PUBLIC_APP_URL);
    const authAppPort = Number(authAppServer?.env?.PORT);

    expect(smokeAppPort).toBeGreaterThan(0);
    expect(smokeAppPort).not.toBe(authAppPort);
  });
});

describe("playwright.auth.config.ts", () => {
  const servers = asArray(authConfig.webServer);
  const kratosServer = servers.find((server) => server.command?.includes("mock-kratos"));
  const appServer = servers.find((server) =>
    server.command?.includes(".next/standalone/server.js"),
  );

  it("only runs specs under tests/auth", () => {
    expect(authConfig.testDir).toBe("./tests/auth");
  });

  it("starts both the mock Kratos server and the app server on distinct ports", () => {
    expect(kratosServer).toBeDefined();
    expect(appServer).toBeDefined();
    expect(kratosServer?.port).toBeGreaterThan(0);
    expect(appServer?.port).toBeGreaterThan(0);
    expect(kratosServer?.port).not.toBe(appServer?.port);
  });

  it("points the app server's Ory SDK URL at the mock Kratos server port", () => {
    expect(appServer?.env?.NEXT_PUBLIC_ORY_SDK_URL).toBe(
      `http://127.0.0.1:${kratosServer?.port}`,
    );
  });

  it("configures the app base URL and baseURL to match the app server's own port", () => {
    const expectedUrl = `http://127.0.0.1:${appServer?.port}`;
    expect(appServer?.env?.NEXT_PUBLIC_APP_URL).toBe(expectedUrl);
    expect(authConfig.use?.baseURL).toBe(expectedUrl);
  });

  it("sends forwarded headers that match the app server's own host over plain http", () => {
    expect(authConfig.use?.extraHTTPHeaders).toEqual({
      "x-forwarded-host": `127.0.0.1:${appServer?.port}`,
      "x-forwarded-proto": "http",
    });
  });
});

describe("package.json", () => {
  it("wires the auth e2e script to the dedicated auth playwright config", () => {
    expect(packageJson.scripts["test:e2e:auth"]).toBe(
      "playwright test --config=playwright.auth.config.ts",
    );
  });
});