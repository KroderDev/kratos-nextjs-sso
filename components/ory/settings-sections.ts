export const SETTINGS_AREA_DEFINITIONS = [
  {
    id: "profile",
    label: "dashboard.settings.areas.profile.label",
    description: "dashboard.settings.areas.profile.description",
  },
  {
    id: "security",
    label: "dashboard.settings.areas.security.label",
    description: "dashboard.settings.areas.security.description",
  },
  {
    id: "connections",
    label: "dashboard.settings.areas.connections.label",
    description: "dashboard.settings.areas.connections.description",
  },
] as const;

export type SettingsArea = (typeof SETTINGS_AREA_DEFINITIONS)[number]["id"];
export type SettingsAreaDefinition = (typeof SETTINGS_AREA_DEFINITIONS)[number];

export const SETTINGS_SECTION_DEFINITIONS = [
  {
    group: "profile",
    area: "profile",
    label: "dashboard.settings.cards.profile.title",
    description: "dashboard.settings.cards.profile.description",
  },
  {
    group: "password",
    area: "security",
    label: "dashboard.settings.cards.password.title",
    description: "dashboard.settings.cards.password.description",
  },
  {
    group: "totp",
    area: "security",
    label: "dashboard.settings.cards.totp.title",
    description: "dashboard.settings.cards.totp.description",
  },
  {
    group: "webauthn",
    area: "security",
    label: "dashboard.settings.cards.webauthn.title",
    description: "dashboard.settings.cards.webauthn.description",
  },
  {
    group: "passkey",
    area: "security",
    label: "dashboard.settings.cards.passkey.title",
    description: "dashboard.settings.cards.passkey.description",
  },
  {
    group: "lookup_secret",
    area: "security",
    label: "dashboard.settings.cards.lookupSecret.title",
    description: "dashboard.settings.cards.lookupSecret.description",
  },
  {
    group: "oidc",
    area: "connections",
    label: "dashboard.settings.cards.oidc.title",
    description: "dashboard.settings.cards.oidc.description",
  },
] as const;

const SETTINGS_AREAS = new Set<SettingsArea>(
  SETTINGS_AREA_DEFINITIONS.map((area) => area.id),
);

/**
 * Determines whether a value identifies a recognized settings area.
 *
 * @param value - The value to validate as a settings area identifier
 * @returns The corresponding settings area if recognized, `undefined` otherwise.
 */
export function getSettingsArea(value: unknown): SettingsArea | undefined {
  return typeof value === "string" && SETTINGS_AREAS.has(value as SettingsArea)
    ? (value as SettingsArea)
    : undefined;
}

/**
 * Retrieves the definition for a settings area.
 *
 * @param area - The settings area identifier
 * @returns The matching area definition, or the profile area definition when no match is found
 */
export function getSettingsAreaDefinition(area: SettingsArea) {
  return SETTINGS_AREA_DEFINITIONS.find((definition) => definition.id === area) ?? SETTINGS_AREA_DEFINITIONS[0];
}
