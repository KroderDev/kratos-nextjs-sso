import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";

import { ThemeProvider } from "./theme-provider";

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children, attribute }: { children: React.ReactNode; attribute?: string }) => (
    <div data-attribute={attribute}>{children}</div>
  ),
}));

describe("ThemeProvider", () => {
  it("forwards provider props and renders its children", () => {
    const markup = renderToStaticMarkup(
      <ThemeProvider attribute="class">
        <span>Application</span>
      </ThemeProvider>,
    );

    expect(markup).toBe('<div data-attribute="class"><span>Application</span></div>');
  });
});
