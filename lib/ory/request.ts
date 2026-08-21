const forwardedHeaders = [
  "accept-language",
  "cache-control",
  "origin",
  "referer",
  "user-agent",
] as const;

/**
 * Extracts the first value from a comma-separated header value.
 *
 * @param value - The header value to parse
 * @returns The trimmed first value, or `undefined` if the input is missing or empty
 */
function firstForwardedValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || undefined;
}

/**
 * Validates a configured application URL for use as an HTTP(S) origin.
 *
 * @param value - The configured application URL
 * @returns `true` if the value is a valid HTTP or HTTPS URL without credentials, query parameters, or a fragment, `false` otherwise.
 */
export function isValidApplicationOrigin(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

/**
 * Determines the request origin from forwarded protocol and host headers.
 *
 * SECURITY NOTE: This function trusts X-Forwarded-Proto and X-Forwarded-Host headers.
 * The ingress/reverse proxy (e.g., nginx, Traefik, CloudFlare) MUST strip any
 * client-supplied X-Forwarded-* headers and replace them with trusted values based
 * on the actual connection. Failure to do so allows attackers to spoof the origin
 * and bypass origin validation, potentially leading to open redirects or session fixation.
 *
 * @param incoming - The request headers containing forwarded origin values
 * @param fallbackOrigin - The origin to use when forwarded values are missing or invalid
 * @returns The validated forwarded origin, or `fallbackOrigin` when it cannot be derived
 */
export function getForwardedOrigin(incoming: Headers, fallbackOrigin: string) {
  const protocol = firstForwardedValue(incoming.get("x-forwarded-proto"));
  const host = firstForwardedValue(incoming.get("x-forwarded-host"));

  if (!protocol || !host || !["http", "https"].includes(protocol)) {
    return fallbackOrigin;
  }

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return fallbackOrigin;
  }
}

/**
 * Validates a forwarded origin against the configured application base URL.
 *
 * @param forwardedOrigin - The origin derived from forwarded headers
 * @param trustedAppBaseUrl - The configured application base URL
 * @returns `true` if no base URL is configured or the origins match; `false` if the base URL is invalid or the origins differ
 */
export function validateForwardedOrigin(
  forwardedOrigin: string,
  trustedAppBaseUrl: string | undefined,
): boolean {
  if (!trustedAppBaseUrl) {
    return true;
  }

  if (!isValidApplicationOrigin(trustedAppBaseUrl)) {
    return false;
  }

  const trustedOrigin = new URL(trustedAppBaseUrl).origin;
  return forwardedOrigin === trustedOrigin;
}

/**
 * Creates request headers for a Kratos flow JSON response.
 *
 * @param incoming - The incoming request headers whose eligible values are forwarded
 * @returns Headers configured to request JSON and preserve eligible browser headers
 */
export function flowRequestHeaders(incoming: Headers): Headers {
  // Kratos must return the flow JSON, regardless of the browser's HTML preference.
  const result = new Headers({ accept: "application/json" });

  for (const name of forwardedHeaders) {
    const value = incoming.get(name);
    if (value) {
      result.set(name, value);
    }
  }

  const cookie = incoming.get("cookie");
  if (cookie) {
    result.set("cookie", cookie);
  }

  return result;
}
