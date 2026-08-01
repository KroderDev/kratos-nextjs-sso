import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DashboardShell } from "./dashboard-shell";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "light" }),
}));

describe("DashboardShell", () => {
  const account = {
    email: "ada@example.com",
    initials: "AW",
    label: "Ada Lovelace",
    logoutUrl: "/self-service/logout/browser",
  };

  it("renders overview navigation and account controls", () => {
    const markup = renderToStaticMarkup(
      <DashboardShell activeNav="overview" account={account}>
        <p>Overview content</p>
      </DashboardShell>,
    );

    expect(markup).toContain('aria-label="Workspace"');
    expect(markup).toContain("Overview");
    expect(markup).toContain("Settings");
    expect(markup).toContain("Ada Lovelace");
    expect(markup).toContain("Overview content");
    expect(markup).toContain("bg-muted px-3 py-2 font-medium");
  });

  it("renders settings as active and omits account controls when absent", () => {
    const markup = renderToStaticMarkup(
      <DashboardShell activeNav="settings">
        <p>Settings content</p>
      </DashboardShell>,
    );

    expect(markup).toContain("Settings content");
    expect(markup).toContain("bg-muted px-3 py-2 font-medium");
    expect(markup).not.toContain("Open account menu for");
  });
});
