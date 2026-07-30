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

export function translateOryText(text: string | undefined, locale?: string): string | undefined {
  if (!text) return undefined;
  if (locale === "es") {
    const lower = text.trim().toLowerCase();
    if (lower in oryTranslationsEs) {
      return oryTranslationsEs[lower];
    }
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

export function isChecked(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}
