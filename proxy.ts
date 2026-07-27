import { createOryMiddleware } from "@ory/nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import oryConfig, { isOryConfigured } from "./ory.config";

const oryMiddleware = createOryMiddleware({
  project: oryConfig.project,
});

export async function proxy(request: NextRequest) {
  if (!isOryConfigured) {
    return NextResponse.next();
  }

  return oryMiddleware(request);
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
