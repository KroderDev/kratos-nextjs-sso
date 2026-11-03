import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rewriteOryResponseLocation } from "./lib/ory/url";
import { getForwardedOrigin, isValidApplicationOrigin } from "./lib/ory/request";
import { formatSettingsAreaCookie } from "./lib/ory/settings-state";
import { getSettingsArea } from "./components/ory/settings-sections";
import oryConfig, { appBaseUrl, isOryConfigured } from "./ory.config";

const oryMiddleware = createOryMiddleware({
  project: oryConfig.project,
});

/**
 * Checks whether an incoming host candidate matches the configured application host,
 * accounting for ports, MagicDNS short names, and internal cluster service names.
 */
function isMatchingAppHost(candidate: string | null | undefined, appUrl: URL): boolean {
  if (!candidate) return false;
  const clean = candidate.split(",", 1)[0].trim().replace(/:\d+$/, "").toLowerCase();
  const appHostname = appUrl.hostname.toLowerCase();
  const shortHostname = appHostname.split(".")[0];
  return (
    clean === appHostname ||
    clean === appUrl.host.toLowerCase() ||
    clean === shortHostname ||
    clean === "aquanit-sso" ||
    clean.startsWith("aquanit-sso.")
  );
}

/**
 * Resolves the effective request origin, taking into account trusted ingress TLS termination
 * and internal proxy host rewrites.
 */
function resolveRequestOrigin(request: NextRequest, trustedAppBaseUrl: string | undefined): string {
  if (trustedAppBaseUrl && isValidApplicationOrigin(trustedAppBaseUrl)) {
    try {
      const appUrl = new URL(trustedAppBaseUrl);
      const forwardedHost = request.headers.get("x-forwarded-host");
      const hostHeader = request.headers.get("host");
      const rawHost = forwardedHost || hostHeader || request.nextUrl.host;

      if (isMatchingAppHost(rawHost, appUrl)) {
        return appUrl.origin;
      }
    } catch {
      // Fall through on error
    }
  }

  return getForwardedOrigin(request.headers, request.nextUrl.origin);
}

/**
 * Processes authentication-related requests through Ory middleware and handles dashboard settings requests.
 *
 * @returns The request response, including status `400` for an invalid application origin and status `503` for missing production configuration.
 */
export async function proxy(request: NextRequest) {
  if (
    isDevPreviewRequest(request.nextUrl.pathname) &&
    process.env.NODE_ENV !== "development"
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (!isOryConfigured) {
    return NextResponse.next();
  }

  if (process.env.NODE_ENV === "production" && !appBaseUrl) {
    return new NextResponse("Invalid application configuration", { status: 503 });
  }

  const requestOrigin = resolveRequestOrigin(request, appBaseUrl);

  if (appBaseUrl) {
    try {
      if (new URL(appBaseUrl).origin !== requestOrigin) {
        console.error(`[SSO Origin Mismatch] appBaseUrl=${new URL(appBaseUrl).origin} requestOrigin=${requestOrigin} host=${request.headers.get("host")} x-f-host=${request.headers.get("x-forwarded-host")} x-f-proto=${request.headers.get("x-forwarded-proto")} nextUrl=${request.nextUrl.toString()}`);
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

function isDevPreviewRequest(pathname: string) {
  return pathname === "/dev/ui-preview" || pathname.startsWith("/dev/ui-preview/");
}

export const config = {
  matcher: [
    "/dev/ui-preview/:path*",
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
