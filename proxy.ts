import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rewriteOryResponseLocation } from "./lib/ory/url";
import { getForwardedOrigin } from "./lib/ory/request";
import oryConfig, { appBaseUrl, isOryConfigured } from "./ory.config";

const oryMiddleware = createOryMiddleware({
  project: oryConfig.project,
});

/**
 * Processes requests through Ory middleware when configured and validates the application origin.
 *
 * @param request - The incoming Next.js request
 * @returns The middleware response, or a `400` response when the configured application origin is invalid or does not match the request origin.
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
  ],
};
