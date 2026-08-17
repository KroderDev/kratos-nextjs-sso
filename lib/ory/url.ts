import type { OryFlow } from "./types";

import {
  appBaseUrl,
  oryCanonicalUrl,
  orySdkUrl,
} from "@/ory.config";

const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
const uiPathMap: Record<string, string> = {
  "/login": "/login",
  "/registration": "/registration",
  "/recovery": "/recovery",
  "/verification": "/verification",
  "/settings": "/dashboard/settings",
};
const providerCallbackPathMap: Record<string, string> = {
  "/auth/login/callback": "/login/callback",
  "/login/callback": "/login/callback",
  "/consent": "/consent",
  "/logout": "/logout",
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

/**
 * Restores provider callbacks that the Ory proxy rewrites to the application origin.
 *
 * @param value - The response location returned by the Ory proxy
 * @param applicationOrigin - The public SSO application origin
 * @param providerOrigin - The public Ory provider origin
 * @returns The provider callback URL when recognized, otherwise the original value
 */
export function restoreOryProviderCallback(
  value: string,
  applicationOrigin: string,
  providerOrigin: string,
) {
  let location: URL;
  let application: URL;
  let provider: URL;

  try {
    location = new URL(value);
    application = new URL(applicationOrigin);
    provider = new URL(providerOrigin);
  } catch {
    return value;
  }

  if (location.origin !== application.origin) {
    return value;
  }

  const callbackPath = providerCallbackPathMap[location.pathname];
  if (!callbackPath) {
    return value;
  }

  const restored = new URL(provider.origin);
  restored.pathname = callbackPath;
  restored.search = location.search;
  restored.hash = location.hash;
  return restored.toString();
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
