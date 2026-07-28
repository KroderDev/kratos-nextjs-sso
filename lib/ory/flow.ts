import type { UiNode, UiText } from "@ory/client-fetch";

type UnknownRecord = Record<string, unknown>;
const providerReferencePattern =
  /\b(?:ory(?:apis)?|kratos)\b|\/(?:self-service|sessions|ui|\.well-known\/ory)(?:\/|\b)/i;

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

export function getNodeLabel(node: UiNode) {
  const attributes = getNodeAttributes(node);
  const attributeLabel = asRecord(attributes.label);
  const metaLabel = asRecord(node.meta?.label);

  return getSafeText(
    getString(attributeLabel.text) ??
      getString(metaLabel.text) ??
      getString(attributes.name),
  );
}

export function getNodeText(node: UiNode) {
  const text = asRecord(getNodeAttributes(node).text);
  return getSafeText(getString(text.text));
}

export function getMessageText(message: UiText) {
  return getSafeText(message.text) ?? "";
}

export function getErrorMessages(messages: UiText[] | undefined) {
  return (messages ?? [])
    .filter((message) => message.type === "error")
    .map((message) => ({
      ...message,
      text: getMessageText(message),
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
