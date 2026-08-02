// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  rememberSettingsAction,
  rememberSettingsArea,
  SettingsNavigation,
} from "./settings-navigation";
import { SETTINGS_AREA_DEFINITIONS } from "./settings-sections";
import { FLOW_SUCCESS_TOASTS_STORAGE_KEY } from "@/lib/ory/settings-state";

let mountedRoot: Root | undefined;
let mountedContainer: HTMLDivElement | undefined;
const originalDocument = globalThis.document;
const originalWindow = globalThis.window;

afterEach(() => {
  if (mountedRoot) {
    act(() => mountedRoot?.unmount());
  }
  mountedContainer?.remove();
  mountedRoot = undefined;
  mountedContainer = undefined;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: originalDocument,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

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

  it("does not require browser globals when remembering an area on the server", () => {
    const browserDocument = globalThis.document;
    const browserWindow = globalThis.window;

    try {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: undefined,
      });

      expect(() => rememberSettingsArea("security")).not.toThrow();
      expect(() => rememberSettingsAction("security")).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: browserDocument,
      });
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: browserWindow,
      });
    }
  });

  it("intercepts unmodified primary clicks and preserves modified navigation", () => {
    const onAreaChange = vi.fn();
    mountedContainer = document.createElement("div");
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(
        <SettingsNavigation
          activeArea="profile"
          areas={SETTINGS_AREA_DEFINITIONS}
          onAreaChange={onAreaChange}
        />,
      );
    });

    const securityLinks = mountedContainer.querySelectorAll<HTMLAnchorElement>(
      'a[href="/dashboard/settings?section=security"]',
    );
    const securityLink = securityLinks[0];
    const mobileSecurityLink = securityLinks[1];
    expect(securityLink).not.toBeNull();
    securityLink?.setAttribute("href", "#");

    const dispatchClick = (target: HTMLAnchorElement | null, event: MouseEvent) => {
      document.addEventListener("click", (clickEvent) => clickEvent.preventDefault(), {
        once: true,
      });
      target?.dispatchEvent(event);
    };

    act(() => {
      dispatchClick(securityLink, new MouseEvent("click", { bubbles: true, button: 0 }));
    });
    expect(onAreaChange).toHaveBeenCalledWith("security");

    onAreaChange.mockClear();
    mobileSecurityLink?.setAttribute("href", "#");
    act(() => {
      dispatchClick(mobileSecurityLink, new MouseEvent("click", { bubbles: true, button: 0 }));
    });
    expect(onAreaChange).toHaveBeenCalledWith("security");

    onAreaChange.mockClear();
    for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) {
      act(() => {
        dispatchClick(
          securityLink,
          new MouseEvent("click", { bubbles: true, button: 0, [modifier]: true }),
        );
      });
    }
    expect(onAreaChange).not.toHaveBeenCalled();

    onAreaChange.mockClear();
    act(() => {
      dispatchClick(securityLink, new MouseEvent("click", { bubbles: true, button: 1 }));
    });
    expect(onAreaChange).not.toHaveBeenCalled();

    onAreaChange.mockClear();
    const preventedClick = new MouseEvent("click", { bubbles: true, button: 0 });
    Object.defineProperty(preventedClick, "defaultPrevented", { value: true });
    act(() => {
      dispatchClick(securityLink, preventedClick);
    });
    expect(onAreaChange).not.toHaveBeenCalled();
  });
});
