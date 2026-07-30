import { getLogoutFlow } from "@ory/nextjs/app";
import type { LogoutFlow } from "@ory/client-fetch";

export async function getSafeLogoutFlow(returnTo?: string): Promise<LogoutFlow> {
  if (returnTo) {
    try {
      return await getLogoutFlow({ returnTo });
    } catch {
      // Fallback if returnTo fails (e.g. 400 Bad Request when return_to domain is not allowed in Ory project settings)
    }
  }

  try {
    return await getLogoutFlow();
  } catch {
    return { logout_url: "#", logout_token: "" };
  }
}
