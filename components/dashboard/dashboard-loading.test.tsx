import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DashboardLoading } from "./dashboard-loading";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "system" }),
}));

describe("DashboardLoading", () => {
  it("renders an accessible dashboard loading state", () => {
    const markup = renderToStaticMarkup(<DashboardLoading />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="Loading dashboard"');
    expect(markup).toContain('data-slot="skeleton"');
    expect((markup.match(/data-slot="skeleton"/g) ?? []).length).toBeGreaterThanOrEqual(15);
  });

  it("matches the responsive settings workspace structure", () => {
    const markup = renderToStaticMarkup(<DashboardLoading variant="settings" />);

    expect(markup).toContain('data-settings-loading="true"');
    expect(markup).toContain("lg:grid-cols-[13rem_minmax(0,1fr)]");
    expect(markup).toContain("hidden flex-col gap-1 lg:flex");
    expect(markup).toContain("lg:hidden");
    expect((markup.match(/data-slot="skeleton"/g) ?? []).length).toBeGreaterThanOrEqual(25);
  });
});
