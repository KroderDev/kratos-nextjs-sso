import type { OryFlow } from "./types";

import {
  appBaseUrl,
  oryCanonicalUrl,
  orySdkUrl,
} from "@/ory.config";

const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
const uiPathMap: Record<string, string> = {
  "/login": "/auth/login",
  "/registration": "/auth/registration",
  "/recovery": "/auth/recovery",
  "/verification": "/auth/verification",
  "/settings": "/auth/settings",
};

function isLocalSdkUrl() {
  try {
    return localHosts.has(new URL(orySdkUrl).hostname);
  } catch {
    return false;
  }
}

function canonicalOrigin() {
  try {
    return new URL(oryCanonicalUrl).origin;
  } catch {
    return undefined;
  }
}

function destinationOrigin(fallback?: string) {
  if (fallback) {
    try {
      return new URL(fallback).origin;
    } catch {
      return undefined;
    }
  }

  try {
    return appBaseUrl ? new URL(appBaseUrl).origin : undefined;
  } catch {
    return undefined;
  }
}

export function rewriteOryUrl(value: string, fallbackOrigin?: string) {
  if (!isLocalSdkUrl()) {
    return value;
  }

  const sourceOrigin = canonicalOrigin();
  const targetOrigin = destinationOrigin(fallbackOrigin);

  if (!sourceOrigin || !targetOrigin) {
    return value;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return value;
  }

  if (url.origin !== sourceOrigin) {
    return value;
  }

  const targetUrl = new URL(targetOrigin);
  url.protocol = targetUrl.protocol;
  url.host = targetUrl.host;
  url.pathname = uiPathMap[url.pathname] ?? url.pathname;

  return url.toString();
}

function rewriteValue(value: unknown, fallbackOrigin?: string): unknown {
  if (typeof value === "string") {
    return rewriteOryUrl(value, fallbackOrigin);
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteValue(item, fallbackOrigin));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        rewriteValue(item, fallbackOrigin),
      ]),
    );
  }

  return value;
}

export function rewriteOryFlow<T extends OryFlow>(
  flow: T | null | undefined | void,
): T | null | undefined {
  if (!flow || !isLocalSdkUrl()) {
    return flow ?? null;
  }

  return rewriteValue(flow) as T;
}

export function rewriteOryResponseLocation(
  response: Response,
  fallbackOrigin: string,
) {
  const location = response.headers.get("location");

  if (!location) {
    return response;
  }

  const rewrittenLocation = rewriteOryUrl(location, fallbackOrigin);

  if (rewrittenLocation !== location) {
    response.headers.set("location", rewrittenLocation);
  }

  return response;
}
