import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { RouteLoading } from "./route-loading";

const usePathname = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname }));
vi.mock("@/components/dashboard/dashboard-loading", () => ({
  DashboardLoading: ({ variant }: { variant?: "overview" | "settings" }) => (
    <div>{variant === "settings" ? "settings loading" : "dashboard loading"}</div>
  ),
}));
vi.mock("./auth-shell", () => ({
  AuthContentLoading: () => <div>auth loading</div>,
  AuthFrame: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));
vi.mock("./page-loading", () => ({
  PageLoading: () => <div>page loading</div>,
}));

describe("RouteLoading", () => {
  it("selects the dashboard loading state", () => {
    usePathname.mockReturnValue("/dashboard");
    expect(renderToStaticMarkup(<RouteLoading />)).toContain("dashboard loading");
  });

  it("selects the settings loading state", () => {
    usePathname.mockReturnValue("/dashboard/settings");
    expect(renderToStaticMarkup(<RouteLoading />)).toContain("settings loading");
  });

  it("selects the auth loading frame", () => {
    usePathname.mockReturnValue("/auth/login");
    const markup = renderToStaticMarkup(<RouteLoading />);
    expect(markup).toContain("<section>");
    expect(markup).toContain("auth loading");
  });

  it("selects the generic page loading state", () => {
    usePathname.mockReturnValue("/settings");
    expect(renderToStaticMarkup(<RouteLoading />)).toContain("page loading");
  });
});
