import type { Identity } from "@ory/client-fetch";

function getStringValue(value: unknown, path: string) {
  let current: unknown = value;

  for (const segment of path.split(".")) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" ? current.trim() : undefined;
}

export function getIdentityEmail(identity: Identity) {
  return (
    getStringValue(identity.traits, "email") ??
    getStringValue(identity.traits, "username") ??
    "Identity member"
  );
}

export function getIdentityName(identity: Identity) {
  const first = getStringValue(identity.traits, "name.first");
  const last = getStringValue(identity.traits, "name.last");
  const fullName = [first, last].filter(Boolean).join(" ");

  return (
    fullName ||
    getStringValue(identity.traits, "name") ||
    getStringValue(identity.traits, "display_name") ||
    getIdentityEmail(identity)
  );
}

function getSafeAvatarUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password
    ) {
      return undefined;
    }

    return value;
  } catch {
    return undefined;
  }
}

export function getIdentityAvatarUrl(identity: Identity) {
  return getSafeAvatarUrl(getStringValue(identity.metadata_public, "avatar_url"));
}

export function getIdentityInitials(identity: Identity) {
  const name = getIdentityName(identity);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "KI";
}
