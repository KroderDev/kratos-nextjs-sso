const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

const sdkUrl = (
  process.env.NEXT_PUBLIC_ORY_SDK_URL ?? process.env.ORY_SDK_URL ?? ""
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

const setupVariable = !sdkUrl
  ? "NEXT_PUBLIC_ORY_SDK_URL"
  : isOryNetworkUrl && !hasProjectApiToken
    ? "ORY_PROJECT_API_TOKEN"
    : "NEXT_PUBLIC_ORY_SDK_URL";

const config = {
  project: {
    name: process.env.NEXT_PUBLIC_ORY_PROJECT_NAME ?? "Kroder Identity",
    default_redirect_url: pageUrl("/dashboard"),
    error_ui_url: pageUrl("/auth/error"),
    login_ui_url: pageUrl("/auth/login"),
    recovery_ui_url: pageUrl("/auth/recovery"),
    registration_ui_url: pageUrl("/auth/registration"),
    settings_ui_url: pageUrl("/auth/settings"),
    verification_ui_url: pageUrl("/auth/verification"),
  },
};

export const appBaseUrl = configuredAppUrl;
export const orySdkUrl = sdkUrl;
export const isOryConfigured =
  Boolean(sdkUrl) && (!isOryNetworkUrl || hasProjectApiToken);
export const orySetupVariable = setupVariable;
export const orySetupMessage = !sdkUrl
  ? "Connect Ory Network or a local Kratos frontend API to enable browser flows."
  : "This Ory Network project needs its server-only proxy token to enable browser flows.";

export default config;
