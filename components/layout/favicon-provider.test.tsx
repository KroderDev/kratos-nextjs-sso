import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { FaviconProvider } from "./favicon-provider";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));

describe("FaviconProvider", () => {
  it("renders no visible markup", () => {
    expect(renderToStaticMarkup(<FaviconProvider />)).toBe("");
  });
});
