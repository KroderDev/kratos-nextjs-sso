const forwardedHeaders = [
  "accept-language",
  "cache-control",
  "origin",
  "referer",
  "user-agent",
] as const;

/**
 * Creates headers for a Kratos flow request while preserving selected browser headers and cookies.
 *
 * @param incoming - The browser request headers to selectively forward
 * @returns Headers configured to request a JSON flow response
 */
function firstForwardedValue(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || undefined;
}

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
