// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";

const state = vi.hoisted(() => ({
  setTheme: vi.fn(),
  theme: "dark" as string | undefined,
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: state.setTheme, theme: state.theme }),
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
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    container?.remove();
    root = undefined;
    container = undefined;
    state.setTheme.mockClear();
    state.theme = "dark";
  });

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

  it("subscribes on the client and uses the active theme", () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(<ThemeToggle />);
    });

    expect(container.querySelector('[data-value="dark"]')).not.toBeNull();
  });

  it("falls back to system when the theme provider has no current theme", () => {
    state.theme = undefined;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(<ThemeToggle />);
    });

    expect(container.querySelector('[data-value="system"]')).not.toBeNull();
  });
});
