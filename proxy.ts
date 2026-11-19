import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rewriteOryResponseLocation } from "./lib/ory/url";
import { getForwardedOrigin, isValidApplicationOrigin } from "./lib/ory/request";
import {
  formatClearLogoutContinuationCookie,
  isSecureOrigin,
  LOGOUT_COMPLETE_PATH,
} from "./lib/ory/logout-continuation";
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

function applyLogoutCompleteHeaders(response: NextResponse, secure: boolean) {
  response.headers.append(
    "Set-Cookie",
    formatClearLogoutContinuationCookie(secure),
  );
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "strict-origin");
  return response;
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
    if (request.nextUrl.pathname === LOGOUT_COMPLETE_PATH) {
      const origin = resolveRequestOrigin(request, appBaseUrl);
      return applyLogoutCompleteHeaders(NextResponse.next(), isSecureOrigin(origin));
    }

    return NextResponse.next();
  }

  if (process.env.NODE_ENV === "production" && !appBaseUrl) {
    return new NextResponse("Invalid application configuration", { status: 503 });
  }

  const requestOrigin = resolveRequestOrigin(request, appBaseUrl);

  if (appBaseUrl) {
    try {
      if (new URL(appBaseUrl).origin !== requestOrigin) {
        console.error(`[SSO Origin Mismatch] appBaseUrl=${new URL(appBaseUrl).origin} requestOrigin=${requestOrigin} host=${request.headers.get("host")} x-f-host=${request.headers.get("x-forwarded-host")} x-f-proto=${request.headers.get("x-forwarded-proto")} pathname=${request.nextUrl.pathname}`);
        return new NextResponse("Invalid application origin", { status: 400 });
      }
    } catch {
      return new NextResponse("Invalid application origin", { status: 400 });
    }
  }

  if (request.nextUrl.pathname === LOGOUT_COMPLETE_PATH) {
    return applyLogoutCompleteHeaders(
      NextResponse.next(),
      isSecureOrigin(requestOrigin),
    );
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
  const rewritten = rewriteOryResponseLocation(response, requestOrigin);
  const completionUrl = new URL(LOGOUT_COMPLETE_PATH, requestOrigin).href;
  const params = request.nextUrl.searchParams;
  // Kratos v26.2.0 forwards an error when the session disappears between
  // flow creation and browser logout. Resume only the fixed completion route;
  // it independently verifies the signed cookie and confirms session inactivity.
  if (
    request.method === "GET" &&
    request.nextUrl.pathname === "/self-service/logout" &&
    params.getAll("return_to").length === 1 &&
    params.get("return_to") === completionUrl &&
    params.getAll("token").length === 1 &&
    params.get("token")?.trim()
  ) {
    let errorRedirect = false;
    const location = rewritten.headers.get("location");
    if (location && rewritten.status >= 300 && rewritten.status < 400) {
      try {
        const target = new URL(location, requestOrigin);
        errorRedirect = target.origin === requestOrigin && target.pathname === "/error";
      } catch {
        // An invalid upstream destination cannot trigger recovery.
      }
    }
    if (rewritten.status >= 400 || errorRedirect) {
      const recovery = NextResponse.redirect(completionUrl, 303);
      for (const cookie of rewritten.headers.getSetCookie()) {
        recovery.headers.append("Set-Cookie", cookie);
      }
      recovery.headers.set("Cache-Control", "no-store");
      recovery.headers.set("Referrer-Policy", "no-referrer");
      return recovery;
    }
  }
  return rewritten;
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
    "/logout/:path*",
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
