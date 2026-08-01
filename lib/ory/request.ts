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
 * Determines the request origin from forwarded protocol and host headers.
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
