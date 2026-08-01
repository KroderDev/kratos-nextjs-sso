import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "dark" }),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioGroup: ({ children, value }: { children: React.ReactNode; value?: string }) => (
    <div data-value={value}>{children}</div>
  ),
  DropdownMenuRadioItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
  DropdownMenuTrigger: ({ children, "aria-label": ariaLabel }: { children: React.ReactNode; "aria-label"?: string }) => (
    <button aria-label={ariaLabel}>{children}</button>
  ),
}));

describe("ThemeToggle", () => {
  it("renders the theme control and all available theme choices", () => {
    const markup = renderToStaticMarkup(<ThemeToggle />);

    expect(markup).toContain('aria-label="Change color theme"');
    expect(markup).toContain("Theme");
    expect(markup).toContain("Appearance");
    expect(markup).toContain("Light");
    expect(markup).toContain("Dark");
    expect(markup).toContain("System");
  });

  it("uses system as the server-rendered selection and preserves option values", () => {
    const markup = renderToStaticMarkup(<ThemeToggle />);

    expect(markup).toContain('data-value="system"');
    expect(markup).toContain('data-value="light"');
    expect(markup).toContain('data-value="dark"');
  });
});
