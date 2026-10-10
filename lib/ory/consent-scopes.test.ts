import { describe, expect, it } from "vitest";

import { getConsentScopeTranslationKeys } from "./consent-scopes";

describe("getConsentScopeTranslationKeys", () => {
  it.each([
    ["openid", "auth.consent.scopes.openid.title"],
    ["profile", "auth.consent.scopes.profile.title"],
    ["email", "auth.consent.scopes.email.title"],
    ["offline_access", "auth.consent.scopes.offlineAccess.title"],
  ])("maps the standard %s scope to localized consent copy", (scope, title) => {
    expect(getConsentScopeTranslationKeys(scope)).toMatchObject({ title });
  });

  it("leaves provider-specific scopes available as their original value", () => {
    expect(getConsentScopeTranslationKeys("team:read")).toBeUndefined();
  });
});
