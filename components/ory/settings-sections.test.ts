import { describe, expect, it } from "vitest";

import {
  getSettingsArea,
  getSettingsAreaDefinition,
  SETTINGS_AREA_DEFINITIONS,
  SETTINGS_SECTION_DEFINITIONS,
  type SettingsArea,
} from "./settings-sections";

describe("settings sections", () => {
  it("accepts only known settings areas", () => {
    expect(getSettingsArea("profile")).toBe("profile");
    expect(getSettingsArea("security")).toBe("security");
    expect(getSettingsArea("connections")).toBe("connections");
    expect(getSettingsArea("billing")).toBeUndefined();
    expect(getSettingsArea(null)).toBeUndefined();
  });

  it("returns the matching area definition and a safe fallback", () => {
    expect(getSettingsAreaDefinition("security").label).toBe(
      "dashboard.settings.areas.security.label",
    );
    expect(getSettingsAreaDefinition("profile")).toBe(SETTINGS_AREA_DEFINITIONS[0]);
    expect(getSettingsAreaDefinition("unknown" as SettingsArea)).toBe(
      SETTINGS_AREA_DEFINITIONS[0],
    );
  });

  it("places WebAuthn and passkey methods in the security area", () => {
    expect(SETTINGS_SECTION_DEFINITIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ area: "security", group: "webauthn" }),
        expect.objectContaining({ area: "security", group: "passkey" }),
      ]),
    );
  });
});
