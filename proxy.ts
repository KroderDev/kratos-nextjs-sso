import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  restoreOryProviderCallback,
  rewriteOryResponseLocation,
} from "./lib/ory/url";
import { getForwardedOrigin } from "./lib/ory/request";
import { formatSettingsAreaCookie } from "./lib/ory/settings-state";
import { getSettingsArea } from "./components/ory/settings-sections";
import oryConfig, { appBaseUrl, isOryConfigured, orySdkUrl } from "./ory.config";

const oryMiddleware = createOryMiddleware({
  project: oryConfig.project,
});

/**
 * Processes authentication-related requests through Ory middleware and handles dashboard settings requests.
 *
 * @returns The request response, including status `400` for an invalid application origin and status `503` for missing production configuration.
 */
export async function proxy(request: NextRequest) {
  if (!isOryConfigured) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV === "production" && !appBaseUrl) {
    return new NextResponse("Invalid application configuration", { status: 503 });
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
        formatSettingsAreaCookie(area),
      );
    }

    return response;
  }

  if (!isOryRequest(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const response = await oryMiddleware(request);
  const location = response.headers.get("location");
  if (location) {
    const restoredLocation = restoreOryProviderCallback(
      location,
      requestOrigin,
      orySdkUrl,
    );
    if (restoredLocation !== location) {
      response.headers.set("location", restoredLocation);
    }
  }

  return rewriteOryResponseLocation(response, requestOrigin);
}

/**
 * Determines whether a pathname targets an Ory-managed route.
 *
 * @param pathname - The request pathname to inspect
 * @returns `true` if the pathname matches an Ory route, `false` otherwise.
 */
function isOryRequest(pathname: string) {
  return (
    pathname.startsWith("/self-service/") ||
    pathname.startsWith("/sessions/") ||
    pathname.startsWith("/ui/") ||
    pathname.startsWith("/.well-known/ory/") ||
    pathname.startsWith("/.ory/")
  );
}

export const config = {
  matcher: [
    "/login/:path*",
    "/registration/:path*",
    "/recovery/:path*",
    "/verification/:path*",
    "/consent",
    "/logout",
    "/error",
    "/dashboard/:path*",
    "/self-service/:path*",
    "/sessions/:path*",
    "/ui/:path*",
    "/.well-known/ory/:path*",
    "/.ory/:path*",
    "/dashboard/settings",
  ],
};
