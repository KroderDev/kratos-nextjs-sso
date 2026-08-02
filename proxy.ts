import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rewriteOryResponseLocation } from "./lib/ory/url";
import { getForwardedOrigin } from "./lib/ory/request";
import { SETTINGS_AREA_COOKIE, SETTINGS_AREA_COOKIE_MAX_AGE } from "./lib/ory/settings-state";
import { getSettingsArea } from "./components/ory/settings-sections";
import oryConfig, { appBaseUrl, isOryConfigured } from "./ory.config";

const oryMiddleware = createOryMiddleware({
  project: oryConfig.project,
});

/**
 * Processes configured requests through Ory middleware and handles settings-area requests.
 *
 * @returns The response for the request, including a `400` response for an invalid application origin.
 */
export async function proxy(request: NextRequest) {
  if (!isOryConfigured) {
    return NextResponse.next();
  }

  const requestOrigin = getForwardedOrigin(request.headers, request.nextUrl.origin);

  if (appBaseUrl) {
    try {
      if (new URL(appBaseUrl).origin !== requestOrigin) {
        return new NextResponse("Invalid application origin", { status: 400 });
      }
    } catch {
      return new NextResponse("Invalid application origin", { status: 400 });
    }
  }

  if (request.nextUrl.pathname === "/dashboard/settings") {
    const area = getSettingsArea(request.nextUrl.searchParams.get("section"));
    const response = NextResponse.next();

    if (area) {
      response.headers.append(
        "Set-Cookie",
        `${SETTINGS_AREA_COOKIE}=${area}; Max-Age=${SETTINGS_AREA_COOKIE_MAX_AGE}; Path=/dashboard/settings; SameSite=Lax`,
      );
    }

    return response;
  }

  const response = await oryMiddleware(request);

  return rewriteOryResponseLocation(response, requestOrigin);
}

export const config = {
  matcher: [
    "/self-service/:path*",
    "/sessions/:path*",
    "/ui/:path*",
    "/.well-known/ory/:path*",
    "/.ory/:path*",
    "/dashboard/settings",
  ],
};
