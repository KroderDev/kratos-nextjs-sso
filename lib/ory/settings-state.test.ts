import { describe, expect, it } from "vitest";

import { formatSettingsAreaCookie } from "./settings-state";

describe("settings state", () => {
  it("formats an encoded, scoped settings area cookie", () => {
    expect(formatSettingsAreaCookie("security area")).toBe(
      "kratos_settings_area=security%20area; Max-Age=120; Path=/dashboard/settings; SameSite=Lax",
    );
  });
});
