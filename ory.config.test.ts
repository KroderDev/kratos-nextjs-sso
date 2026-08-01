import { describe, expect, it, vi } from "vitest";

import config, {
  appBaseUrl,
  isOryConfigured,
  oryCanonicalUrl,
  orySdkUrl,
  orySetupMessage,
} from "./ory.config";

describe("ory.config", () => {
  it("exports project route configuration", () => {
    expect(config.project.login_ui_url).toBe("/auth/login");
    expect(config.project.registration_ui_url).toBe("/auth/registration");
    expect(config.project.recovery_ui_url).toBe("/auth/recovery");
    expect(config.project.verification_ui_url).toBe("/auth/verification");
    expect(config.project.settings_ui_url).toBe("/dashboard/settings");
    expect(config.project.error_ui_url).toBe("/auth/error");
    expect(config.project.default_redirect_url).toBe("/dashboard");
    expect(config.project.name).toBeDefined();
  });

  it("exports expected environment defaults or configured values", () => {
    expect(typeof orySdkUrl).toBe("string");
    expect(typeof oryCanonicalUrl).toBe("string");
    expect(typeof appBaseUrl === "string" || appBaseUrl === undefined).toBe(true);
    expect(typeof isOryConfigured).toBe("boolean");
    expect(typeof orySetupMessage).toBe("string");
  });

  it("provides appropriate setup message depending on configuration state", () => {
    if (!orySdkUrl) {
      expect(orySetupMessage).toContain("not configured");
    } else {
      expect(orySetupMessage).toContain("unavailable");
    }
  });

  it("normalizes configured URLs and uses the project name", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example/");
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "https://tenant.oryapis.com/");
    vi.stubEnv("NEXT_PUBLIC_ORY_CANONICAL_URL", "https://ory.example/");
    vi.stubEnv("NEXT_PUBLIC_ORY_PROJECT_NAME", "  Example project  ");
    vi.stubEnv("ORY_PROJECT_API_TOKEN", "token");

    try {
      const configured = await import("./ory.config");
      expect(configured.appBaseUrl).toBe("https://app.example");
      expect(configured.orySdkUrl).toBe("https://tenant.oryapis.com");
      expect(configured.oryCanonicalUrl).toBe("https://ory.example");
      expect(configured.isOryConfigured).toBe(true);
      expect(configured.default.project.name).toBe("Example project");
      expect(configured.orySetupMessage).toContain("unavailable");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("does not treat an Ory network URL as configured without a project token", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ORY_SDK_URL", "https://tenant.oryapis.com");
    vi.stubEnv("ORY_PROJECT_API_TOKEN", "");

    try {
      const configured = await import("./ory.config");
      expect(configured.isOryConfigured).toBe(false);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("falls back to the legacy SDK environment variable", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_ORY_SDK_URL;
    vi.stubEnv("ORY_SDK_URL", "http://localhost:4010/");

    try {
      const configured = await import("./ory.config");
      expect(configured.orySdkUrl).toBe("http://localhost:4010");
      expect(configured.isOryConfigured).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
