const allowedProtocols = new Set(["http:", "https:"]);

/**
 * Parses the public OAuth authorization origins used by the CSP form-action
 * directive. Provider origins are build-time configuration, not secrets.
 */
export function getOAuthOrigins(value: string | undefined) {
  const origins = new Set<string>();

  for (const candidate of value?.split(/[\s,]+/) ?? []) {
    if (!candidate) {
      continue;
    }

    try {
      const url = new URL(candidate);

      if (
        !allowedProtocols.has(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        continue;
      }

      origins.add(url.origin);
    } catch {
      // Ignore malformed provider origins rather than weakening the CSP.
    }
  }

  return [...origins];
}

export function getFormActionSources(
  sdkOrigin: string | undefined,
  oauthOrigins: string[],
) {
  return ["'self'", sdkOrigin, ...oauthOrigins].filter(Boolean).join(" ");
}
