import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuthContentReady } from "./auth-content-ready";

describe("AuthContentReady", () => {
  it("renders no visible markup", () => {
    expect(renderToStaticMarkup(<AuthContentReady />)).toBe("");
  });
});
