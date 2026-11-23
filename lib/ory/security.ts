const safeProtocols = new Set(["http:", "https:"]);

export function httpOrigin(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    return safeProtocols.has(url.protocol) && !url.username && !url.password
      ? url.origin
      : undefined;
  } catch {
    return undefined;
  }
}

export function allowedOryOrigins(values: string[]) {
  return new Set(values.map(httpOrigin).filter((value): value is string => Boolean(value)));
}

export function isSafeProviderUrl(
  value: string | undefined,
  allowedOrigins: ReadonlySet<string>,
) {
  if (
    !value || value !== value.trim() || value.startsWith("//") ||
    /[\\\p{Cc}]/u.test(value)
  ) {
    return false;
  }

  try {
    const relativeOrigin = "https://invalid.local";
    const url = new URL(value, relativeOrigin);

    if (!safeProtocols.has(url.protocol) || url.username || url.password) {
      return false;
    }

    // A relative input must remain on the base origin after WHATWG parsing.
    if (!/^[a-z][a-z\d+.-]*:/i.test(value)) {
      return url.origin === relativeOrigin;
    }

    return allowedOrigins.has(url.origin);
  } catch {
    return false;
  }
}

export function isSafeFlowAction(
  value: string | undefined,
  allowedOrigins: ReadonlySet<string>,
) {
  return isSafeProviderUrl(value, allowedOrigins);
}
