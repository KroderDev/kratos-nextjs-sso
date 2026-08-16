const allowedProtocols = new Set(["http:", "https:"]);

/**
 * Parses configured origins for use in a CSP `form-action` directive.
 *
 * @param value - A whitespace- or comma-separated list of URLs
 * @returns Unique HTTP or HTTPS origins without credentials, paths, queries, or fragments
 */
export function getConfiguredOrigins(value: string | undefined) {
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
      // Ignore malformed configured origins rather than weakening the CSP.
    }
  }

  return [...origins];
}

/**
 * Builds the space-separated CSP `form-action` source list.
 *
 * @param sdkOrigin - The optional SDK origin to include
 * @param originLists - Additional origin lists to include
 * @returns The CSP `form-action` source list containing `'self'` and the provided origins
 */
export function getFormActionSources(
  sdkOrigin: string | undefined,
  ...originLists: string[][]
) {
  const sources = ["'self'", sdkOrigin, ...originLists.flat()].filter(
    (source): source is string => Boolean(source),
  );

  return [...new Set(sources)].join(" ");
}
