import { brandName } from "@/lib/branding";

const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

const sdkUrl = (
  process.env.NEXT_PUBLIC_ORY_SDK_URL ?? process.env.ORY_SDK_URL ?? ""
).replace(/\/$/, "");

const canonicalOryUrl = (
  process.env.NEXT_PUBLIC_ORY_CANONICAL_URL ?? ""
).replace(/\/$/, "");

const pageUrl = (path: string) => path;

const isOryNetworkUrl = (() => {
  try {
    return new URL(sdkUrl).hostname.endsWith(".oryapis.com");
  } catch {
    return false;
  }
})();

const hasProjectApiToken = Boolean(process.env.ORY_PROJECT_API_TOKEN);
const projectName =
  process.env.NEXT_PUBLIC_ORY_PROJECT_NAME?.trim() || brandName;

const config = {
  project: {
    name: projectName,
    default_redirect_url: pageUrl("/dashboard"),
    error_ui_url: pageUrl("/error"),
    login_ui_url: pageUrl("/login"),
    recovery_ui_url: pageUrl("/recovery"),
    registration_ui_url: pageUrl("/registration"),
    settings_ui_url: pageUrl("/dashboard/settings"),
    verification_ui_url: pageUrl("/verification"),
  },
};

export const appBaseUrl = configuredAppUrl;
export const orySdkUrl = sdkUrl;
export const oryCanonicalUrl = canonicalOryUrl;
export const isOryConfigured =
  Boolean(sdkUrl) && (!isOryNetworkUrl || hasProjectApiToken);
export const isRegistrationEnabled =
  process.env.NEXT_PUBLIC_ORY_REGISTRATION_ENABLED !== "false";
export const orySetupMessage = !sdkUrl
  ? "The authentication service is not configured. Contact an administrator to enable access."
  : "The authentication service is unavailable. Contact an administrator to enable access.";

export default config;
