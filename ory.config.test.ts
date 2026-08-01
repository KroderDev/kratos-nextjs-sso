import { describe, expect, it } from "vitest";

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
});
