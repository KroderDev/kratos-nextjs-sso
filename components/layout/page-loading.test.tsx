import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PageLoading } from "./page-loading";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "system" }),
}));

describe("PageLoading", () => {
  it("renders an accessible loading page with repeated skeleton content", () => {
    const markup = renderToStaticMarkup(<PageLoading />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Loading next page"');
    expect((markup.match(/data-slot="skeleton"/g) ?? []).length).toBeGreaterThan(10);
    expect((markup.match(/data-slot="separator"/g) ?? []).length).toBe(2);
  });
});
