import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rewriteOryResponseLocation } from "./lib/ory/url";
import oryConfig, { appBaseUrl, isOryConfigured } from "./ory.config";

const oryMiddleware = createOryMiddleware({
  project: oryConfig.project,
});

export async function proxy(request: NextRequest) {
  if (!isOryConfigured) {
    return NextResponse.next();
  }

  if (appBaseUrl) {
    try {
      if (new URL(appBaseUrl).origin !== request.nextUrl.origin) {
        return new NextResponse("Invalid application origin", { status: 400 });
      }
    } catch {
      return new NextResponse("Invalid application origin", { status: 400 });
    }
  }

  const response = await oryMiddleware(request);

  return rewriteOryResponseLocation(response, request.nextUrl.origin);
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
