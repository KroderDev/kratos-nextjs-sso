import type { OryFlow } from "./types";
import { httpOrigin } from "./security";

import {
  appBaseUrl,
  oryCanonicalUrl,
  oryProviderOrigin,
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
const applicationHandoffQueryMap: Record<string, string> = {
  "/consent": "provider_return_to",
  "/logout": "return_to",
};

/**
 * Builds an application-origin URL for a flow return path.
 *
 * Kratos resolves relative return_to values against its protocol origin. Keep
 * authentication fallbacks absolute whenever the public app origin is known.
 */
export function applicationUrl(path: string) {
  if (!appBaseUrl) {
    return path;
  }

  try {
    return new URL(path, appBaseUrl).toString();
  } catch {
    return path;
  }
}

function isLocalSdkUrl() {
  try {
    return localHosts.has(new URL(orySdkUrl).hostname);
  } catch {
    return false;
  }
}

function canonicalOrigin() {
  return httpOrigin(oryCanonicalUrl);
}

function destinationOrigin(fallback?: string) {
  return httpOrigin(fallback || appBaseUrl);
}

export function rewriteOryUrl(value: string, fallbackOrigin?: string) {
  const sdkOrigin = httpOrigin(orySdkUrl);
  const sourceOrigin = isLocalSdkUrl() ? canonicalOrigin() : undefined;
  const targetOrigin = destinationOrigin(fallbackOrigin);

  if ((!sdkOrigin && !sourceOrigin) || !targetOrigin) {
    return value;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return value;
  }

  if (url.origin !== sourceOrigin && url.origin !== sdkOrigin) {
    return value;
  }

  if (isProviderCallback(url)) {
    if (url.origin === sdkOrigin && oryProviderOrigin && url.origin !== oryProviderOrigin) {
      const provider = new URL(oryProviderOrigin);
      url.protocol = provider.protocol;
      url.host = provider.host;
      url.port = provider.port;
      url.pathname = providerCallbackPathMap[url.pathname];
      return url.toString();
    }
    return value;
  }

  const targetUrl = new URL(targetOrigin);
  url.protocol = targetUrl.protocol;
  url.host = targetUrl.host;
  url.port = targetUrl.port;
  url.pathname = uiPathMap[url.pathname] ?? url.pathname;

  return url.toString();
}

function isProviderCallback(url: URL) {
  const handoffQuery = applicationHandoffQueryMap[url.pathname];
  return Boolean(
    providerCallbackPathMap[url.pathname] &&
      !(handoffQuery && url.searchParams.has(handoffQuery)),
  );
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
  providerOrigin: string | undefined,
) {
  let location: URL;
  let application: URL;
  let provider: URL;

  try {
    location = new URL(value);
    application = new URL(applicationOrigin);
    if (!providerOrigin || !httpOrigin(providerOrigin)) {
      return value;
    }
    provider = new URL(providerOrigin);
  } catch {
    return value;
  }

  if (location.origin !== application.origin) {
    return value;
  }

  // Consent and logout handoffs reuse provider callback paths. Keep marked
  // application handoffs local so their route-level validation can run.
  const handoffQuery = applicationHandoffQueryMap[location.pathname];
  if (handoffQuery && location.searchParams.has(handoffQuery)) {
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

export function rewriteOryFlow<T extends OryFlow>(
  flow: T | null | undefined | void,
  fallbackOrigin?: string,
): T | null {
  // The SDK can return a disabled-flow payload without a UI container.
  if (!flow?.ui) {
    return flow ?? null;
  }

  return {
    ...flow,
    ui: {
      ...flow.ui,
      action: rewriteOryUrl(flow.ui.action, fallbackOrigin),
      nodes: flow.ui.nodes.map((node) => {
        const attributes = node.attributes;
        switch (attributes.node_type) {
          case "a":
            return {
              ...node,
              attributes: { ...attributes, href: rewriteOryUrl(attributes.href, fallbackOrigin) },
            };
          case "img":
          case "script":
            return {
              ...node,
              attributes: { ...attributes, src: rewriteOryUrl(attributes.src, fallbackOrigin) },
            };
          default:
            return node;
        }
      }),
    },
  };
}

export function rewriteOryResponseLocation(
  response: Response,
  fallbackOrigin: string,
) {
  const location = response.headers.get("location");

  if (!location) {
    return response;
  }

  // Callback restoration is the final routing decision, not an app UI rewrite.
  const restoredLocation = restoreOryProviderCallback(
    location,
    fallbackOrigin,
    oryProviderOrigin,
  );
  const rewrittenLocation = restoredLocation !== location
    ? restoredLocation
    : rewriteOryUrl(location, fallbackOrigin);

  if (rewrittenLocation !== location) {
    response.headers.set("location", rewrittenLocation);
  }

  return response;
}
