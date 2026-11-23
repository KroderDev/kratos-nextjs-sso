export type ConsentScopeTranslationKeys = {
  title: string;
  description: string;
};

/**
 * Returns localized copy keys for common OpenID Connect scopes.
 * Unknown scopes are intentionally left for the UI to display verbatim.
 */
export function getConsentScopeTranslationKeys(
  scope: string,
): ConsentScopeTranslationKeys | undefined {
  switch (scope) {
    case "openid":
      return {
        title: "auth.consent.scopes.openid.title",
        description: "auth.consent.scopes.openid.description",
      };
    case "profile":
      return {
        title: "auth.consent.scopes.profile.title",
        description: "auth.consent.scopes.profile.description",
      };
    case "email":
      return {
        title: "auth.consent.scopes.email.title",
        description: "auth.consent.scopes.email.description",
      };
    case "offline_access":
      return {
        title: "auth.consent.scopes.offlineAccess.title",
        description: "auth.consent.scopes.offlineAccess.description",
      };
    default:
      return undefined;
  }
}
