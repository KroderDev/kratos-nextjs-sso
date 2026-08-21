import { getLogoutFlow } from "@ory/nextjs/app";
import type { LogoutFlow } from "@ory/client-fetch";

import { appBaseUrl, orySdkUrl } from "@/ory.config";

/**
 * Rewrites a provider logout URL to use the application's protocol and host.
 *
 * @param value - The logout URL to rewrite
 * @returns The rewritten URL, or the original value when it does not match the provider origin or cannot be parsed
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
 * Applies the application's protocol and host to the flow's logout URL when applicable.
 *
 * @param flow - The logout flow to update
 * @returns The logout flow with its `logout_url` processed for the application
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
