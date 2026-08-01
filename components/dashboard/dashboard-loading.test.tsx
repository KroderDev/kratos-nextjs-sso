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
});
