// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NavigationFeedback, shouldClearPendingNavigation } from "./navigation-feedback";

const usePathname = vi.hoisted(() => vi.fn().mockReturnValue("/settings"));
const isDashboardRoute = vi.hoisted(() =>
  vi.fn((path: string) => path === "/dashboard" || path === "/dashboard/settings"),
);
const isAuthLayoutRoute = vi.hoisted(() =>
  vi.fn((path: string) =>
    ["/login", "/registration", "/recovery", "/verification", "/consent", "/logout", "/error"].some(
      (route) => path === route || path.startsWith(`${route}/`),
    ) && !isDashboardRoute(path),
  ),
);

vi.mock("next/navigation", () => ({ usePathname }));
vi.mock("@/lib/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/lib/routing", () => ({
  isAuthLayoutRoute,
  isDashboardRoute,
}));
vi.mock("@/components/dashboard/dashboard-loading", () => ({
  DashboardLoading: ({ variant }: { variant?: "overview" | "settings" }) => (
    <div data-dashboard-loading-variant={variant}>dashboard-loading</div>
  ),
}));
vi.mock("./auth-shell", () => ({
  AuthContentLoading: () => <div>auth-content-loading</div>,
  AuthFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("navigation feedback", () => {
  let mountedRoot: Root | undefined;
  let mountedContainer: HTMLDivElement | undefined;
  let localLink: HTMLAnchorElement | undefined;
  let dashboardLink: HTMLAnchorElement | undefined;

  afterEach(() => {
    if (mountedRoot) {
      act(() => mountedRoot?.unmount());
    }
    mountedContainer?.remove();
    localLink?.remove();
    dashboardLink?.remove();
    mountedRoot = undefined;
    mountedContainer = undefined;
    localLink = undefined;
    dashboardLink = undefined;
    usePathname.mockReturnValue("/settings");
    vi.useRealTimers();
  });

  describe("shouldClearPendingNavigation", () => {
    it("clears ordinary route navigation once the target pathname is active", () => {
      expect(shouldClearPendingNavigation("route", "/settings", "/settings")).toBe(true);
    });

    it("keeps document, mismatched, auth, and dashboard navigations pending", () => {
      expect(shouldClearPendingNavigation("document", undefined, "/settings")).toBe(false);
      expect(shouldClearPendingNavigation("route", "/settings", "/dashboard")).toBe(false);
      expect(shouldClearPendingNavigation("route", "/login", "/login")).toBe(false);
      expect(shouldClearPendingNavigation("route", "/dashboard", "/dashboard")).toBe(false);
    });

    it("does not clear a route when the pending kind or target is missing", () => {
      expect(shouldClearPendingNavigation(undefined, undefined, "/settings")).toBe(false);
      expect(shouldClearPendingNavigation("route", undefined, "/settings")).toBe(false);
      expect(shouldClearPendingNavigation("route", "/settings", undefined as never)).toBe(false);
    });

    it("does not clear a document-kind navigation even when pathnames match", () => {
      expect(shouldClearPendingNavigation("document", "/settings", "/settings")).toBe(false);
    });
  });

  describe("component rendering", () => {
    it("renders an idle status bar when no navigation is pending", () => {
      const markup = renderToStaticMarkup(<NavigationFeedback />);

      expect(markup).toContain('aria-busy="false"');
      expect(markup).toContain('role="status"');
      expect(markup).toContain('class="h-full w-0"');
      expect(markup).not.toContain("navigation-progress");
      expect(markup).not.toContain("auth-content-loading");
      expect(markup).not.toContain("dashboard-loading");
    });

    it("includes the accessible label for screen readers", () => {
      const markup = renderToStaticMarkup(<NavigationFeedback />);

      expect(markup).toContain("common.navigation.loadingNextPage");
    });

    it("does not show route feedback for local navigation links", () => {
      mountedContainer = document.createElement("div");
      localLink = document.createElement("a");
      localLink.dataset.localNavigation = "true";
      localLink.href = "/dashboard/settings?section=security";
      localLink.addEventListener("click", (event) => event.preventDefault());
      document.body.append(localLink);
      document.body.append(mountedContainer);
      mountedRoot = createRoot(mountedContainer);

      act(() => {
        mountedRoot?.render(<NavigationFeedback />);
      });

      act(() => {
        localLink?.dispatchEvent(
          new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
        );
      });

      expect(mountedContainer.querySelector('[aria-busy="true"]')).toBeNull();
      expect(mountedContainer.textContent).not.toContain("dashboard-loading");
    });

  it("uses the settings skeleton for dashboard settings navigation", () => {
      mountedContainer = document.createElement("div");
      dashboardLink = document.createElement("a");
      dashboardLink.href = "/dashboard/settings?section=security";
      dashboardLink.addEventListener("click", (event) => event.preventDefault());
      document.body.append(dashboardLink);
      document.body.append(mountedContainer);
      mountedRoot = createRoot(mountedContainer);

      act(() => {
        mountedRoot?.render(<NavigationFeedback />);
      });

      act(() => {
        dashboardLink?.dispatchEvent(
          new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
        );
      });

      expect(mountedContainer.querySelector('[aria-busy="true"]')).not.toBeNull();
      expect(
        mountedContainer.querySelector("[data-dashboard-loading-variant]")?.getAttribute(
          "data-dashboard-loading-variant",
        ),
      ).toBe("settings");
  });

  it("shows auth feedback for a same-origin auth link", () => {
    mountedContainer = document.createElement("div");
    localLink = document.createElement("a");
    localLink.href = "/login";
    localLink.addEventListener("click", (event) => event.preventDefault());
    document.body.append(localLink);
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(<NavigationFeedback />);
    });
    act(() => {
      localLink?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
      );
    });

    expect(mountedContainer.textContent).toContain("auth-content-loading");
    expect(mountedContainer.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("shows the overview skeleton for dashboard navigation", () => {
    mountedContainer = document.createElement("div");
    dashboardLink = document.createElement("a");
    dashboardLink.href = "/dashboard";
    dashboardLink.addEventListener("click", (event) => event.preventDefault());
    document.body.append(dashboardLink);
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(<NavigationFeedback />);
    });
    act(() => {
      dashboardLink?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
      );
    });

    expect(
      mountedContainer.querySelector("[data-dashboard-loading-variant]")?.getAttribute(
        "data-dashboard-loading-variant",
      ),
    ).toBe("overview");
  });

  it("starts document feedback for an uncancelled form submission", () => {
    mountedContainer = document.createElement("div");
    const form = document.createElement("form");
    document.body.append(form, mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(<NavigationFeedback />);
    });
    act(() => {
      form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    });

    expect(mountedContainer.querySelector('[aria-busy="true"]')).not.toBeNull();

    const prevented = new SubmitEvent("submit", { bubbles: true, cancelable: true });
    prevented.preventDefault();
    act(() => form.dispatchEvent(prevented));
    expect(mountedContainer.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("ignores modified, non-primary, prevented, and non-element clicks", () => {
    mountedContainer = document.createElement("div");
    const link = document.createElement("a");
    link.href = "/dashboard";
    document.body.append(link, mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(<NavigationFeedback />);
    });

    for (const event of [
      new MouseEvent("click", { bubbles: true, button: 1 }),
      new MouseEvent("click", { bubbles: true, button: 0, ctrlKey: true }),
      new MouseEvent("click", { bubbles: true, button: 0, metaKey: true }),
      new MouseEvent("click", { bubbles: true, button: 0, shiftKey: true }),
      new MouseEvent("click", { bubbles: true, button: 0, altKey: true }),
    ]) {
      act(() => link.dispatchEvent(event));
    }

    const prevented = new MouseEvent("click", { bubbles: true, cancelable: true });
    prevented.preventDefault();
    act(() => link.dispatchEvent(prevented));
    act(() => document.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(mountedContainer.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it("ignores external, current, disabled, download, and new-tab links", () => {
    mountedContainer = document.createElement("div");
    const links = [
      Object.assign(document.createElement("a"), { href: "https://other.example/path" }),
      Object.assign(document.createElement("a"), { href: "/settings" }),
      Object.assign(document.createElement("a"), { href: "/dashboard" }),
      Object.assign(document.createElement("a"), { href: "/dashboard" }),
      Object.assign(document.createElement("a"), { href: "/dashboard" }),
    ];
    links[1]?.setAttribute("aria-disabled", "true");
    links[2]?.setAttribute("download", "");
    links[3]?.setAttribute("target", "_blank");
    links[4]?.setAttribute("data-local-navigation", "true");
    for (const link of links) {
      link.addEventListener("click", (event) => event.preventDefault());
      document.body.append(link);
    }
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(<NavigationFeedback />);
    });
    for (const link of links) {
      act(() => {
        link.dispatchEvent(
          new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
        );
      });
    }

    expect(mountedContainer.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it("clears pending navigation on lifecycle and ready events", () => {
    mountedContainer = document.createElement("div");
    localLink = document.createElement("a");
    localLink.href = "/login";
    localLink.addEventListener("click", (event) => event.preventDefault());
    document.body.append(localLink, mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(<NavigationFeedback />);
    });
    act(() => {
      localLink?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
      );
    });
    expect(mountedContainer.querySelector('[aria-busy="true"]')).not.toBeNull();

    act(() => {
      window.dispatchEvent(new CustomEvent("auth-content-ready", { detail: "/other" }));
    });
    expect(mountedContainer.querySelector('[aria-busy="true"]')).not.toBeNull();

    act(() => {
      window.dispatchEvent(new CustomEvent("auth-content-ready", { detail: "/login" }));
    });
    expect(mountedContainer.querySelector('[aria-busy="true"]')).toBeNull();

    act(() => {
      localLink?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
      );
      window.dispatchEvent(new Event("pageshow"));
    });
    expect(mountedContainer.querySelector('[aria-busy="true"]')).toBeNull();

    dashboardLink = document.createElement("a");
    dashboardLink.href = "/dashboard";
    dashboardLink.addEventListener("click", (event) => event.preventDefault());
    document.body.append(dashboardLink);
    act(() => {
      dashboardLink?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
      );
      window.dispatchEvent(
        new CustomEvent("dashboard-content-ready", { detail: "/other" }),
      );
    });
    expect(mountedContainer.querySelector('[aria-busy="true"]')).not.toBeNull();

    act(() => {
      window.dispatchEvent(
        new CustomEvent("dashboard-content-ready", { detail: "/dashboard" }),
      );
    });
    expect(mountedContainer.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it("clears ordinary route feedback when the pathname catches up", () => {
    vi.useFakeTimers();
    mountedContainer = document.createElement("div");
    const link = document.createElement("a");
    link.href = "/profile";
    link.addEventListener("click", (event) => event.preventDefault());
    document.body.append(link, mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(<NavigationFeedback />);
    });
    act(() => {
      link.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
      );
    });
    expect(mountedContainer.querySelector('[aria-busy="true"]')).not.toBeNull();

    usePathname.mockReturnValue("/profile");
    act(() => {
      mountedRoot?.render(<NavigationFeedback />);
    });
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(mountedContainer.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it("clears pending navigation after the timeout", () => {
    vi.useFakeTimers();
    mountedContainer = document.createElement("div");
    const link = document.createElement("a");
    link.href = "/profile";
    link.addEventListener("click", (event) => event.preventDefault());
    document.body.append(link, mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(<NavigationFeedback />);
    });
    act(() => {
      link.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
      );
    });
    expect(mountedContainer.querySelector('[aria-busy="true"]')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(mountedContainer.querySelector('[aria-busy="true"]')).toBeNull();
  });
});
});
