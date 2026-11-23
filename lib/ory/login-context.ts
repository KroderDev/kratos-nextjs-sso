import type { LoginFlow, UiNode } from "@ory/client-fetch";

import { isValidLocale, type Locale } from "@/lib/i18n/config";

import { getNodeAttributes, getString } from "./flow";

export type LoginContextParams = Record<string, string | string[] | undefined>;

export type LoginDisplayMode = "page" | "popup" | "touch" | "wap";

export type LoginContextHints = {
  display?: LoginDisplayMode;
  loginHint?: string;
  uiLocale?: Locale;
};

const loginContextParamNames = new Set(["login_hint", "ui_locales", "display"]);
const loginHintMaxBytes = 256;
const uiLocalesMaxLength = 256;
const uiLocalesMaxCount = 16;
const displayModes = new Set<LoginDisplayMode>(["page", "popup", "touch", "wap"]);
const languageTagPattern = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/;
const controlCharacterPattern = /[\u0000-\u001f\u007f-\u009f]/;
const loginHintFormatCharacterPattern = /\p{Cf}/u;
const utf8Encoder = new TextEncoder();

function singleParam(params: LoginContextParams, name: string) {
  const value = params[name];
  return typeof value === "string" ? value : undefined;
}

function parseLoginHint(value: string | undefined) {
  if (
    !value ||
    value.length > loginHintMaxBytes ||
    utf8Encoder.encode(value).byteLength > loginHintMaxBytes ||
    !value.trim() ||
    controlCharacterPattern.test(value) ||
    loginHintFormatCharacterPattern.test(value)
  ) {
    return undefined;
  }

  return value;
}

function parseUiLocale(value: string | undefined): Locale | undefined {
  if (
    !value ||
    value.length > uiLocalesMaxLength ||
    controlCharacterPattern.test(value)
  ) {
    return undefined;
  }

  const preferences = value.split(" ");
  if (
    preferences.length > uiLocalesMaxCount ||
    preferences.some((tag) => !languageTagPattern.test(tag))
  ) {
    return undefined;
  }

  for (const preference of preferences) {
    const baseLanguage = preference.split("-")[0]?.toLowerCase();
    if (isValidLocale(baseLanguage)) {
      return baseLanguage;
    }
  }

  return undefined;
}

function parseDisplay(value: string | undefined): LoginDisplayMode | undefined {
  return value && value.length <= 16 && displayModes.has(value as LoginDisplayMode)
    ? (value as LoginDisplayMode)
    : undefined;
}

/**
 * Parses the optional OIDC login context using only unambiguous, bounded values.
 * Invalid, duplicated, or unsupported values are ignored.
 */
export function parseLoginContextHints(params: LoginContextParams): LoginContextHints {
  return {
    display: parseDisplay(singleParam(params, "display")),
    loginHint: parseLoginHint(singleParam(params, "login_hint")),
    uiLocale: parseUiLocale(singleParam(params, "ui_locales")),
  };
}

/**
 * Returns the OIDC locale preference unless a supported explicit `lang` wins.
 * An undefined result lets the normal locale resolver apply its existing fallback.
 */
export function getLoginLocaleOverride(
  params: LoginContextParams,
  hints = parseLoginContextHints(params),
): Locale | undefined {
  const explicitLocale = singleParam(params, "lang");
  if (isValidLocale(explicitLocale)) {
    return undefined;
  }

  return hints.uiLocale;
}

/**
 * Removes login-only OIDC hints before parameters are passed into flow URLs.
 */
export function stripLoginContextHints(params: LoginContextParams): LoginContextParams {
  const clean: LoginContextParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (!loginContextParamNames.has(key)) {
      clean[key] = value;
    }
  }
  return clean;
}

function hasNonEmptyValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== undefined && value !== null;
}

/**
 * Prefills only an empty Kratos identifier input without mutating the flow.
 */
export function prefillLoginIdentifier(
  flow: LoginFlow | null | undefined,
  loginHint: string | undefined,
): LoginFlow | null | undefined {
  if (!flow || !loginHint) {
    return flow;
  }

  const hasExistingIdentifier = flow.ui.nodes.some((node) => {
    return (
      node.type === "input" &&
      getString(getNodeAttributes(node).name) === "identifier" &&
      hasNonEmptyValue(getNodeAttributes(node).value)
    );
  });
  if (hasExistingIdentifier) {
    return flow;
  }

  let changed = false;
  let prefilled = false;
  const nodes = flow.ui.nodes.map((node): UiNode => {
    const attributes = getNodeAttributes(node);
    if (
      node.type !== "input" ||
      getString(attributes.name) !== "identifier" ||
      prefilled ||
      hasNonEmptyValue(attributes.value)
    ) {
      return node;
    }

    changed = true;
    prefilled = true;
    return {
      ...node,
      attributes: { ...attributes, value: loginHint },
    } as UiNode;
  });

  return changed ? { ...flow, ui: { ...flow.ui, nodes } } : flow;
}
