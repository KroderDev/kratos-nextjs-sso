import { appBaseUrl, orySdkUrl } from "@/ory.config";

export type ProviderFlow = "login" | "consent";
type ProviderFlowValue = ProviderFlow | "logout";
type LocaleParam = "en" | "es";

export type FlowSearchParams = Record<string, string | string[] | undefined>;

export type ConsentHandoff = {
  csrf: string;
  clientName: string;
  locale?: LocaleParam;
  providerReturnTo: string;
  scopes: string[];
  skipConsent: boolean;
  transaction: string;
};

const providerFlows = new Set<ProviderFlowValue>(["login", "consent", "logout"]);
const callbackPaths: Record<ProviderFlow, string> = {
  login: "/login/callback",
  consent: "/consent",
};
const maxOpaqueValueLength = 256;
const maxClientNameLength = 256;
const maxScopeValueLength = 2048;
const maxScopeCount = 64;

/**
 * Extracts a query parameter when it has exactly one string value.
 *
 * @param params - The query parameters to inspect
 * @param name - The parameter name
 * @returns The parameter value, or `undefined` when it is missing or has multiple values
 */
function singleParam(params: FlowSearchParams, name: string) {
  const value = params[name];
  if (typeof value === "string") {
    return value;
  }
  return Array.isArray(value) && value.length === 1 ? value[0] : undefined;
}

/**
 * Extracts the supported provider flow from query parameters.
 *
 * @param params - Query parameters containing the provider flow
 * @returns The provider flow value, or `undefined` when the parameter is missing or unsupported
 */
function providerFlow(params: FlowSearchParams): ProviderFlowValue | undefined {
  const value = singleParam(params, "flow");
  return value && providerFlows.has(value as ProviderFlowValue)
    ? (value as ProviderFlowValue)
    : undefined;
}

/**
 * Determines whether a value is a valid opaque identifier.
 *
 * @param value - The value to validate
 * @returns `true` if the value is nonempty, within the allowed length, and contains only letters, numbers, underscores, or hyphens; `false` otherwise.
 */
function isOpaqueValue(value: string | undefined): value is string {
  return Boolean(
    value &&
      value.length <= maxOpaqueValueLength &&
      /^[A-Za-z0-9_-]+$/.test(value),
  );
}

/**
 * Extracts the origin from the configured Ory SDK URL.
 *
 * @returns The URL origin, or `undefined` when the configured URL is invalid.
 */
function providerOrigin() {
  try {
    return new URL(orySdkUrl).origin;
  } catch {
    return undefined;
  }
}

/**
 * Validates a provider callback URL for the specified flow.
 *
 * @param value - The callback URL to validate
 * @param flow - The provider flow whose callback path must be used
 * @param expected - The outer handoff credentials that must match any nested callback values
 * @returns The parsed callback URL when valid, otherwise `undefined`
 */
function providerCallback(
  value: string | undefined,
  flow: ProviderFlow,
  expected: { transaction: string; csrf: string },
) {
  if (!value || value.length > 2048) {
    return undefined;
  }

  try {
    const parsed = new URL(value);
    if (
      parsed.origin !== providerOrigin() ||
      parsed.username ||
      parsed.password ||
      parsed.hash ||
      parsed.pathname !== callbackPaths[flow]
    ) {
      return undefined;
    }

    const queryKeys = [...parsed.searchParams.keys()];
    if (queryKeys.length > 0) {
      const nestedTransaction = parsed.searchParams.get("transaction") ?? undefined;
      const nestedCSRF = parsed.searchParams.get("csrf") ?? undefined;
      if (
        queryKeys.length !== 3 ||
        new Set(queryKeys).size !== 3 ||
        !queryKeys.every((key) => ["csrf", "flow", "transaction"].includes(key)) ||
        parsed.searchParams.get("flow") !== flow ||
        !isOpaqueValue(nestedTransaction) ||
        !isOpaqueValue(nestedCSRF) ||
        nestedTransaction !== expected.transaction ||
        nestedCSRF !== expected.csrf
      ) {
        return undefined;
      }
      parsed.search = "";
    }

    return parsed;
  } catch {
    return undefined;
  }
}

/**
 * Parses a whitespace-separated scope parameter into individual scopes.
 *
 * @param value - The scope parameter value
 * @returns The parsed scopes, or an empty array if the value exceeds validation limits
 */
function scopesFromParam(value: string | undefined) {
  if (!value || value.length > maxScopeValueLength) {
    return [];
  }

  const scopes = value.split(/\s+/).filter(Boolean);
  if (
    scopes.length > maxScopeCount ||
    scopes.some((scope) => scope.length > 128 || /[^\x21-\x7e]/.test(scope))
  ) {
    return [];
  }
  return scopes;
}

/**
 * Extracts a supported locale from the flow parameters.
 *
 * @returns `"en"` or `"es"` when the `lang` parameter specifies a supported locale; `undefined` otherwise.
 */
function localeFromParams(params: FlowSearchParams): LocaleParam | undefined {
  const locale = singleParam(params, "lang");
  return locale === "en" || locale === "es" ? locale : undefined;
}

/**
 * Builds the internal login continue URL for a provider handoff.
 *
 * @param handoff - Login handoff data to encode in the URL
 * @returns An absolute URL when an application base URL is configured; otherwise, a path-relative URL
 */
function loginContinueParams(handoff: ConsentHandoff) {
  const base = appBaseUrl || "https://sso.invalid";
  const internal = new URL("/auth/login/continue", base);
  internal.searchParams.set("transaction", handoff.transaction);
  internal.searchParams.set("csrf", handoff.csrf);
  internal.searchParams.set("provider_callback", handoff.providerReturnTo);
  if (handoff.locale) {
    internal.searchParams.set("lang", handoff.locale);
  }

  return appBaseUrl
    ? internal.toString()
    : `${internal.pathname}${internal.search}`;
}

/**
 * Builds the internal consent URL for a provider handoff.
 *
 * @param handoff - Consent handoff data to encode in the URL
 * @returns An absolute URL when an application base URL is configured; otherwise, a path-relative URL
 */
function consentReturnTo(handoff: ConsentHandoff) {
  const base = appBaseUrl || "https://sso.invalid";
  const internal = new URL("/auth/consent", base);
  internal.searchParams.set("provider_return_to", handoff.providerReturnTo);
  internal.searchParams.set("transaction", handoff.transaction);
  internal.searchParams.set("csrf", handoff.csrf);
  if (handoff.clientName) {
    internal.searchParams.set("client_name", handoff.clientName);
  }
  if (handoff.scopes.length > 0) {
    internal.searchParams.set("scope", handoff.scopes.join(" "));
  }
  if (handoff.skipConsent) {
    internal.searchParams.set("skip_consent", "true");
  }
  if (handoff.locale) {
    internal.searchParams.set("lang", handoff.locale);
  }

  return appBaseUrl
    ? internal.toString()
    : `${internal.pathname}${internal.search}`;
}

/**
 * Parses and validates provider login or consent handoff parameters.
 *
 * @param params - Query parameters containing the provider handoff data
 * @returns Normalized consent handoff data, or `null` for invalid or unsupported parameters
 */
function parseHandoff(params: FlowSearchParams): ConsentHandoff | null {
  const flow = providerFlow(params);
  if (flow !== "login" && flow !== "consent") {
    return null;
  }

  const transaction = singleParam(params, "transaction");
  const csrf = singleParam(params, "csrf");
  if (!isOpaqueValue(transaction) || !isOpaqueValue(csrf)) {
    return null;
  }

  const returnTo = providerCallback(singleParam(params, "return_to"), flow, {
    csrf,
    transaction,
  });
  if (!returnTo) {
    return null;
  }

  const clientName = singleParam(params, "client_name") ?? "";
  if (
    clientName.length > maxClientNameLength ||
    /[\u0000-\u001f\u007f]/.test(clientName)
  ) {
    return null;
  }

  const rawScope = singleParam(params, "scope");
  const scopes = scopesFromParam(rawScope);
  if (flow === "consent" && rawScope && scopes.length === 0) {
    return null;
  }

  return {
    csrf,
    clientName,
    locale: localeFromParams(params),
    providerReturnTo: returnTo.toString(),
    scopes,
    skipConsent: singleParam(params, "skip_consent") === "true",
    transaction,
  };
}

/**
 * Determines whether the parameters contain a supported provider handoff flow.
 *
 * @param params - The flow query parameters to inspect
 * @returns `true` if the parameters contain a supported provider flow, `false` otherwise.
 */
export function isProviderHandoff(params: FlowSearchParams) {
  return Boolean(providerFlow(params));
}

/**
 * Converts provider handoff parameters into a clean Kratos browser-flow request.
 *
 * @param params - Provider or non-provider flow parameters
 * @returns The transformed flow parameters, the original parameters for non-provider requests, or `null` for an invalid provider handoff
 */
export function providerLoginParams(params: FlowSearchParams): FlowSearchParams | null {
  if (!isProviderHandoff(params)) {
    return params;
  }

  const handoff = parseHandoff(params);
  if (!handoff) {
    return null;
  }

  const clean: FlowSearchParams = {};
  if (handoff.locale) {
    clean.lang = handoff.locale;
  }

  if (providerFlow(params) === "login") {
    clean.return_to = loginContinueParams(handoff);
  } else {
    clean.return_to = consentReturnTo(handoff);
  }

  return clean;
}

/**
 * Parses and validates the consent handoff after browser authentication.
 *
 * @param params - Query parameters containing the consent handoff data
 * @returns The normalized consent handoff, or `null` when the parameters are invalid
 */
export function consentHandoff(params: FlowSearchParams): ConsentHandoff | null {
  const transaction = singleParam(params, "transaction");
  const csrf = singleParam(params, "csrf");
  if (!isOpaqueValue(transaction) || !isOpaqueValue(csrf)) {
    return null;
  }

  const providerReturnTo = providerCallback(
    singleParam(params, "provider_return_to"),
    "consent",
    { csrf, transaction },
  );
  if (!providerReturnTo) {
    return null;
  }

  const clientName = singleParam(params, "client_name") ?? "";
  const rawScope = singleParam(params, "scope");
  const scopes = scopesFromParam(rawScope);
  if (
    clientName.length > maxClientNameLength ||
    /[\u0000-\u001f\u007f]/.test(clientName) ||
    (rawScope && scopes.length === 0)
  ) {
    return null;
  }

  return {
    csrf,
    clientName,
    locale: localeFromParams(params),
    providerReturnTo: providerReturnTo.toString(),
    scopes,
    skipConsent: singleParam(params, "skip_consent") === "true",
    transaction,
  };
}
