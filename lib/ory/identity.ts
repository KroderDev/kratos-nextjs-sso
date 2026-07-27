import type { Identity } from "@ory/client-fetch";

function getTraitValue(traits: unknown, path: string) {
  let current: unknown = traits;

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
    getTraitValue(identity.traits, "email") ??
    getTraitValue(identity.traits, "username") ??
    "Identity member"
  );
}

export function getIdentityName(identity: Identity) {
  const first = getTraitValue(identity.traits, "name.first");
  const last = getTraitValue(identity.traits, "name.last");
  const fullName = [first, last].filter(Boolean).join(" ");

  return (
    fullName ||
    getTraitValue(identity.traits, "name") ||
    getTraitValue(identity.traits, "display_name") ||
    getIdentityEmail(identity)
  );
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
