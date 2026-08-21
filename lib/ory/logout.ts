import { getLogoutFlow } from "@ory/nextjs/app";
import type { LogoutFlow } from "@ory/client-fetch";

import { appBaseUrl, orySdkUrl } from "@/ory.config";

/**
 * Rewrites a provider logout URL to use the application's protocol and host.
 *
 * @param value - The logout URL to rewrite
 * @returns The rewritten URL, or the original value when configuration is missing, the URL does not match the provider origin, or parsing fails
 */
function rewriteLogoutUrl(value: string) {
  if (!appBaseUrl || !orySdkUrl) {
    return value;
  }

  try {
    const providerUrl = new URL(orySdkUrl);
    const applicationUrl = new URL(appBaseUrl);
    const logoutUrl = new URL(value);

    if (logoutUrl.origin !== providerUrl.origin) {
      return value;
    }

    logoutUrl.protocol = applicationUrl.protocol;
    logoutUrl.host = applicationUrl.host;
    return logoutUrl.toString();
  } catch {
    return value;
  }
}

/**
 * Determines whether a logout URL resolves to an allowed origin.
 *
 * @param value - The logout URL to validate
 * @returns `true` if the URL resolves to the Ory provider origin or application origin, or if no Ory SDK URL is configured; `false` if the URL cannot be parsed or resolves elsewhere
 */
function isSafeLogoutUrl(value: string) {
  if (!orySdkUrl) {
    return true;
  }

  try {
    const providerOrigin = new URL(orySdkUrl).origin;
    const applicationOrigin = appBaseUrl ? new URL(appBaseUrl).origin : undefined;
    const parsed = new URL(value, appBaseUrl ?? orySdkUrl);

    return parsed.origin === providerOrigin || parsed.origin === applicationOrigin;
  } catch {
    return false;
  }
}

/**
 * Processes a logout flow's URL for application compatibility and safety.
 *
 * @param flow - The logout flow to process
 * @returns The flow with a safe, processed `logout_url`, or `"#"` when the URL is unsafe
 */
function withApplicationLogoutUrl(flow: LogoutFlow): LogoutFlow {
  const logoutUrl = rewriteLogoutUrl(flow.logout_url);

  return {
    ...flow,
    logout_url: isSafeLogoutUrl(logoutUrl) ? logoutUrl : "#",
  };
}

/**
 * Retrieves a logout flow, optionally using a return URL.
 *
 * @param returnTo - The URL to redirect to after logout
 * @returns The logout flow, or a fallback flow with `logout_url` set to `"#"` when retrieval fails
 */
export async function getSafeLogoutFlow(returnTo?: string): Promise<LogoutFlow> {
  if (returnTo) {
    try {
      return withApplicationLogoutUrl(await getLogoutFlow({ returnTo }));
    } catch {
      // Fallback if returnTo fails (e.g. 400 Bad Request when return_to domain is not allowed in Ory project settings)
    }
  }

  try {
    return withApplicationLogoutUrl(await getLogoutFlow());
  } catch {
    return { logout_url: "#", logout_token: "" };
  }
}
