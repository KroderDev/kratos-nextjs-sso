export type FlowSearchParams = Record<string, string | string[] | undefined>;

/**
 * Builds a flow route without the stale flow identifier while preserving
 * explicitly approved public parameters such as language and return_to.
 *
 * @param path - The application route that should receive the fresh flow
 * @param params - The current route search parameters
 * @param keys - Search parameter names allowed to survive the restart
 * @returns The clean route with its approved parameters
 */
export function buildCleanFlowUrl(
  path: string,
  params: FlowSearchParams,
  keys: string[],
) {
  const searchParams = new URLSearchParams();

  for (const key of keys) {
    const value = params[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    } else if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}
