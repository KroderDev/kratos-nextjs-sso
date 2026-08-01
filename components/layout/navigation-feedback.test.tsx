import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { NavigationFeedback, shouldClearPendingNavigation } from "./navigation-feedback";

const usePathname = vi.hoisted(() => vi.fn().mockReturnValue("/settings"));
const isDashboardRoute = vi.hoisted(() =>
  vi.fn((path: string) => path === "/dashboard" || path === "/dashboard/settings"),
);
const isAuthLayoutRoute = vi.hoisted(() =>
  vi.fn((path: string) => path.startsWith("/auth/") && !isDashboardRoute(path)),
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
  DashboardLoading: () => <div>dashboard-loading</div>,
}));
vi.mock("./auth-shell", () => ({
  AuthContentLoading: () => <div>auth-content-loading</div>,
  AuthFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("navigation feedback", () => {
  describe("shouldClearPendingNavigation", () => {
    it("clears ordinary route navigation once the target pathname is active", () => {
      expect(shouldClearPendingNavigation("route", "/settings", "/settings")).toBe(true);
    });

    it("keeps document, mismatched, auth, and dashboard navigations pending", () => {
      expect(shouldClearPendingNavigation("document", undefined, "/settings")).toBe(false);
      expect(shouldClearPendingNavigation("route", "/settings", "/dashboard")).toBe(false);
      expect(shouldClearPendingNavigation("route", "/auth/login", "/auth/login")).toBe(false);
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
  });
});
