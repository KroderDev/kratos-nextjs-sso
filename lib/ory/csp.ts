const allowedProtocols = new Set(["http:", "https:"]);

/**
 * Parses configured OAuth provider origins for use in a CSP `form-action` directive.
 *
 * @param value - A whitespace- or comma-separated list of provider URLs
 * @returns Unique HTTP or HTTPS origins without credentials, paths, queries, or fragments
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
        url.hash ||
        url.hostname.includes("*")
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

/**
 * Builds the space-separated CSP `form-action` source list.
 *
 * @param sdkOrigin - The optional SDK origin to include
 * @param oauthOrigins - OAuth provider origins to include
 * @returns The CSP `form-action` source list containing `'self'` and the provided origins
 */
export function getFormActionSources(
  sdkOrigin: string | undefined,
  oauthOrigins: string[],
) {
  return ["'self'", sdkOrigin, ...oauthOrigins].filter(Boolean).join(" ");
}
