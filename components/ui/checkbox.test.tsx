import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@base-ui/react/checkbox", () => ({
  Checkbox: {
    Root: ({ className, ...props }: Record<string, unknown>) => (
      <span className={className as string} {...props} />
    ),
    Indicator: ({ className, ...props }: Record<string, unknown>) => (
      <span data-slot="checkbox-indicator" className={className as string} {...props} />
    ),
  },
}));

import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders with data-slot checkbox", () => {
    const markup = renderToStaticMarkup(<Checkbox />);
    expect(markup).toContain('data-slot="checkbox"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<Checkbox className="custom-checkbox" />);
    expect(markup).toContain("custom-checkbox");
  });

  it("renders indicator with data-slot checkbox-indicator", () => {
    const markup = renderToStaticMarkup(<Checkbox />);
    expect(markup).toContain('data-slot="checkbox-indicator"');
  });
});
