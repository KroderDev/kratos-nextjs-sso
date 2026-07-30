const safeProtocols = new Set(["http:", "https:"]);

function originOf(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    return safeProtocols.has(url.protocol) ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

export function allowedOryOrigins(values: string[]) {
  return new Set(values.map(originOf).filter((value): value is string => Boolean(value)));
}

export function isSafeProviderUrl(
  value: string | undefined,
  allowedOrigins: ReadonlySet<string>,
) {
  if (!value || value.startsWith("//")) {
    return false;
  }

  try {
    const url = new URL(value, "https://invalid.local");

    if (!safeProtocols.has(url.protocol) || url.username || url.password) {
      return false;
    }

    // Relative URLs are resolved against the application origin by the browser.
    if (!/^[a-z][a-z\d+.-]*:/i.test(value)) {
      return true;
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
