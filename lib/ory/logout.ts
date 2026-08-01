import { getLogoutFlow } from "@ory/nextjs/app";
import type { LogoutFlow } from "@ory/client-fetch";

import { appBaseUrl, orySdkUrl } from "@/ory.config";

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

function withApplicationLogoutUrl(flow: LogoutFlow): LogoutFlow {
  return {
    ...flow,
    logout_url: rewriteLogoutUrl(flow.logout_url),
  };
}

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
