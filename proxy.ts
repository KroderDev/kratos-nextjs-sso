import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rewriteOryResponseLocation } from "./lib/ory/url";
import oryConfig, { isOryConfigured } from "./ory.config";

const oryMiddleware = createOryMiddleware({
  project: oryConfig.project,
});

export async function proxy(request: NextRequest) {
  if (!isOryConfigured) {
    return NextResponse.next();
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
