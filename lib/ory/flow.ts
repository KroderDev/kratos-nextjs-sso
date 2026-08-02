import type { UiNode, UiText } from "@ory/client-fetch";

type UnknownRecord = Record<string, unknown>;
const providerReferencePattern =
  /\b(?:ory(?:apis)?|kratos)\b|\/(?:self-service|sessions|ui|\.well-known\/ory)(?:\/|\b)/i;

const oryTranslationsEs: Record<string, string> = {
  // Field labels
  "email": "Correo electrónico",
  "email address": "Correo electrónico",
  "e-mail": "Correo electrónico",
  "identifier": "Identificador",
  "id": "Identificador",
  "password": "Contraseña",
  "current password": "Contraseña actual",
  "new password": "Nueva contraseña",
  "confirm password": "Confirmar contraseña",
  "repeat password": "Repetir contraseña",
  "first name": "Nombre",
  "given name": "Nombre",
  "last name": "Apellido",
  "family name": "Apellido",
  "verification code": "Código de verificación",
  "code": "Código de verificación",
  "totp code": "Código TOTP",
  "lookup code": "Código de recuperación",
  "traits.email": "Correo electrónico",
  "traits.name.first": "Nombre",
  "traits.name.last": "Apellido",
  // Buttons & Actions
  "sign in": "Iniciar sesión",
  "sign up": "Registrarse",
  "register": "Registrarse",
  "save": "Guardar",
  "submit": "Enviar",
  "continue": "Continuar",
  "resend code": "Reenviar código",
  "generate new backup recovery codes": "Generar nuevos códigos de recuperación de respaldo",
  // Messages & Errors
  "use a valid address.": "Usa una dirección válida.",
  "the credential is invalid.": "La credencial no es válida.",
  "the recovery code is invalid or has already been used.": "El código de recuperación no es válido o ya ha sido utilizado.",
  "an email containing a recovery code has been sent to the email address you provided.": "Se ha enviado un correo electrónico con el código de recuperación a tu dirección.",
  "an email containing a verification code has been sent to the email address you provided.": "Se ha enviado un correo electrónico con el código de verificación a tu dirección.",
  "an email containing a recovery link has been sent to the email address you provided.": "Se ha enviado un correo electrónico con el enlace de recuperación a tu dirección.",
  "an email containing a verification link has been sent to the email address you provided.": "Se ha enviado un correo electrónico con el enlace de verificación a tu dirección.",
  "you successfully saved your settings.": "Has guardado tu configuración correctamente.",
};

/**
 * Translates supported Ory text for Spanish or English locales.
 *
 * @param text - The text to translate
 * @param locale - The target locale
 * @returns The translated text, the original text when no translation applies, or `undefined` for empty input
 */
export function translateOryText(text: string | undefined, locale?: string): string | undefined {
  if (!text) return undefined;
  if (locale === "es") {
    const lower = text.trim().toLowerCase();
    if (lower in oryTranslationsEs) {
      return oryTranslationsEs[lower];
    }
  }
  if (locale === "en" && text.trim().toLowerCase() === "e-mail") {
    return "Email";
  }
  return text;
}

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : {};
}

export function getString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
}

export function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function getNodeAttributes(node: UiNode) {
  return asRecord(node.attributes);
}

export function getNodeMessages(node: UiNode) {
  return node.messages ?? [];
}

/**
 * Gets a localized, sanitized label for a UI node.
 *
 * @param node - The UI node whose label should be retrieved
 * @param locale - The locale used to translate supported text
 * @returns The node label, or `undefined` when no usable label is available
 */
export function getNodeLabel(node: UiNode, locale?: string) {
  const attributes = getNodeAttributes(node);
  const attributeLabel = asRecord(attributes.label);
  const metaLabel = asRecord(node.meta?.label);

  const raw = getSafeText(
    getString(attributeLabel.text) ??
      getString(metaLabel.text) ??
      getString(attributes.name),
  );

  return translateOryText(raw, locale);
}

/**
 * Identifies the identity provider represented by a UI node.
 *
 * @param node - The UI node containing the provider label or value
 * @returns The normalized provider name, a cleaned label, or `"Provider"` when no provider name is available
 */
export function getProviderName(node: UiNode) {
  const attributes = getNodeAttributes(node);
  const attributeLabel = asRecord(attributes.label);
  const metaLabel = asRecord(node.meta?.label);
  const label = getString(attributeLabel.text) ?? getString(metaLabel.text);
  const value = getString(attributes.value);
  const source = `${label ?? ""} ${value ?? ""}`.toLowerCase();
  const providers = [
    [/\bapple\b/, "Apple"],
    [/\b(?:facebook|meta)\b/, "Meta"],
    [/\bgithub\b/, "GitHub"],
    [/\bgoogle\b/, "Google"],
    [/\bmicrosoft\b/, "Microsoft"],
    [/\bdiscord\b/, "Discord"],
    [/\blinkedin\b/, "LinkedIn"],
    [/\bslack\b/, "Slack"],
    [/\bspotify\b/, "Spotify"],
    [/\b(?:twitter|x)\b/, "X"],
    [/\bamazon\b/, "Amazon"],
    [/\bnet[- ]?id\b/, "NetID"],
    [/\bauth0\b/, "Auth0"],
    [/\bauthentik\b/, "Authentik"],
    [/\bgitlab\b/, "GitLab"],
    [/\bkeycloak\b/, "Keycloak"],
    [/\bclerk\b/, "Clerk"],
    [/\bpaypal\b/, "PayPal"],
    [/\bline\b/, "LINE"],
    [/\bkakao(?:talk)?\b/, "Kakao"],
    [/\bwechat\b/, "WeChat"],
    [/\bkick\b/, "Kick"],
    [/\bory(?:[- ]?oauth2)?\b/, "Ory OAuth2"],
    [/\bokta\b/, "Okta"],
    [/\bsalesforce\b/, "Salesforce"],
    [/\bzoom\b/, "Zoom"],
    [/\btwitch\b/, "Twitch"],
    [/\btiktok\b/, "TikTok"],
    [/\breddit\b/, "Reddit"],
    [/\bdropbox\b/, "Dropbox"],
    [/\byahoo\b/, "Yahoo!"],
    [/\bbitbucket\b/, "Bitbucket"],
  ] as const;

  for (const [pattern, name] of providers) {
    if (pattern.test(source)) {
      return name;
    }
  }

  return (label ?? "Provider")
    .replace(/^(sign in|continue)\s+with\s+/i, "")
    .trim() || "Provider";
}

/**
 * Retrieves and translates the sanitized text associated with a UI node.
 *
 * @param node - The UI node whose text to retrieve
 * @param locale - The locale used for translation
 * @returns The translated text, or `undefined` when the node has no usable text
 */
export function getNodeText(node: UiNode, locale?: string) {
  const text = asRecord(getNodeAttributes(node).text);
  const raw = getSafeText(getString(text.text));
  return translateOryText(raw, locale);
}

export function getMessageText(message: UiText, locale?: string) {
  const raw = getSafeText(message.text) ?? "";
  return translateOryText(raw, locale) ?? "";
}

export function getErrorMessages(messages: UiText[] | undefined, locale?: string) {
  return (messages ?? [])
    .filter((message) => message.type === "error")
    .map((message) => ({
      ...message,
      text: getMessageText(message, locale),
    }))
    .filter((message) => message.text);
}

export function getSafeText(value: string | undefined) {
  const text = value?.trim();

  if (!text || providerReferencePattern.test(text)) {
    return undefined;
  }

  return text;
}

/**
 * Determines whether a UI node is a verification code input.
 *
 * @returns `true` if the node is a text input named `code` with a maximum length from 4 through 8, `false` otherwise.
 */
export function isCodeInput(node: UiNode) {
  const attributes = getNodeAttributes(node);
  const name = getString(attributes.name);
  const type = getString(attributes.type);
  const maxLength = getNumber(attributes.maxlength);

  return (
    node.type === "input" &&
    name === "code" &&
    type === "text" &&
    maxLength !== undefined &&
    maxLength >= 4 &&
    maxLength <= 8
  );
}

/**
 * Determines whether a UI node represents an identity provider action.
 *
 * @param node - The UI node to inspect
 * @returns `true` if the node is a submit or button input named `provider` or grouped as `oidc`, `false` otherwise.
 */
export function isProviderNode(node: UiNode) {
  const attributes = getNodeAttributes(node);
  const type = getString(attributes.type);
  const name = getString(attributes.name);

  return (
    node.type === "input" &&
    (type === "submit" || type === "button") &&
    (name === "provider" || node.group === "oidc")
  );
}

/**
 * Determines whether a value represents an enabled or checked state.
 *
 * @param value - The value to evaluate
 * @returns `true` for `true`, `"true"`, `"on"`, or `"1"`; `false` otherwise
 */
export function isChecked(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}
