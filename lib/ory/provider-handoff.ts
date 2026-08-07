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

function singleParam(params: FlowSearchParams, name: string) {
  const value = params[name];
  if (typeof value === "string") {
    return value;
  }
  return Array.isArray(value) && value.length === 1 ? value[0] : undefined;
}

function providerFlow(params: FlowSearchParams): ProviderFlowValue | undefined {
  const value = singleParam(params, "flow");
  return value && providerFlows.has(value as ProviderFlowValue)
    ? (value as ProviderFlowValue)
    : undefined;
}

function isOpaqueValue(value: string | undefined): value is string {
  return Boolean(
    value &&
      value.length <= maxOpaqueValueLength &&
      /^[A-Za-z0-9_-]+$/.test(value),
  );
}

function providerOrigin() {
  try {
    return new URL(orySdkUrl).origin;
  } catch {
    return undefined;
  }
}

function providerCallback(value: string | undefined, flow: ProviderFlow) {
  if (!value || value.length > 2048) {
    return undefined;
  }

  try {
    const parsed = new URL(value);
    if (
      parsed.origin !== providerOrigin() ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== callbackPaths[flow]
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

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

function localeFromParams(params: FlowSearchParams): LocaleParam | undefined {
  const locale = singleParam(params, "lang");
  return locale === "en" || locale === "es" ? locale : undefined;
}

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

  const returnTo = providerCallback(singleParam(params, "return_to"), flow);
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

export function isProviderHandoff(params: FlowSearchParams) {
  return Boolean(providerFlow(params));
}

/**
 * Converts the provider's opaque handoff into a fresh Kratos browser-flow
 * request. The provider callback is carried inside return_to so Kratos can
 * return the browser with the transaction proof after authentication.
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
    const callback = new URL(handoff.providerReturnTo);
    callback.searchParams.set("transaction", handoff.transaction);
    callback.searchParams.set("csrf", handoff.csrf);
    clean.return_to = callback.toString();
  } else {
    clean.return_to = consentReturnTo(handoff);
  }

  return clean;
}

/**
 * Parses the internal consent handoff after Kratos has authenticated the
 * browser. The provider callback remains origin- and path-bound.
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
