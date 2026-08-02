import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  rememberSettingsAction,
  rememberSettingsArea,
  SettingsNavigation,
} from "./settings-navigation";
import { SETTINGS_AREA_DEFINITIONS } from "./settings-sections";
import { FLOW_SUCCESS_TOASTS_STORAGE_KEY } from "@/lib/ory/settings-state";

describe("SettingsNavigation", () => {
  it("renders the desktop navigation and mobile tabs", () => {
    const markup = renderToStaticMarkup(
      <SettingsNavigation activeArea="security" areas={SETTINGS_AREA_DEFINITIONS} />,
    );

    expect(markup).toContain('aria-label="Settings navigation"');
    expect(markup).toContain('href="/dashboard/settings?section=profile"');
    expect(markup).toContain('href="/dashboard/settings?section=security"');
    expect(markup).toContain('href="/dashboard/settings?section=connections"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('aria-label="Choose a settings area"');
    expect(markup).toContain(">Security<");
  });

  it("keeps navigable links inside the client workspace", () => {
    const markup = renderToStaticMarkup(
      <SettingsNavigation
        activeArea="profile"
        areas={SETTINGS_AREA_DEFINITIONS}
        onAreaChange={() => undefined}
      />,
    );

    expect(markup).toContain('href="/dashboard/settings?section=security"');
    expect(markup).toContain('aria-current="page"');
  });

  it("stores the selected area in a short-lived settings cookie", () => {
    const originalDocument = globalThis.document;
    const cookieTarget = { cookie: "" } as Document;

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: cookieTarget,
    });

    rememberSettingsArea("security");

    expect(cookieTarget.cookie).toContain("kratos_settings_area=security");
    expect(cookieTarget.cookie).toContain("Max-Age=120");
    expect(cookieTarget.cookie).toContain("Path=/dashboard/settings");

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
  });

  it("keeps the active Ory flow in area links", () => {
    const markup = renderToStaticMarkup(
      <SettingsNavigation
        activeArea="profile"
        areas={SETTINGS_AREA_DEFINITIONS}
        flowId="flow-123"
        locale="es"
      />,
    );

    expect(markup).toContain('href="/dashboard/settings?section=security&amp;flow=flow-123&amp;lang=es"');
  });

  it("clears the previous success toast only when an action is submitted", () => {
    const originalWindow = globalThis.window;
    const storedValues = new Map<string, string>([
      [FLOW_SUCCESS_TOASTS_STORAGE_KEY, "[\"previous-success\"]"],
    ]);
    const storage = {
      getItem: (key: string) => storedValues.get(key) ?? null,
      removeItem: (key: string) => storedValues.delete(key),
      setItem: (key: string, value: string) => storedValues.set(key, value),
    } as unknown as Storage;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage: storage },
    });

    rememberSettingsAction("security");

    expect(storedValues.has(FLOW_SUCCESS_TOASTS_STORAGE_KEY)).toBe(false);

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });
});
