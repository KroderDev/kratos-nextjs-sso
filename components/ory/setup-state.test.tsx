import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OrySetupState } from "./setup-state";

describe("OrySetupState", () => {
  it("renders the setup message and a return-home link", () => {
    const markup = renderToStaticMarkup(<OrySetupState />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Access is temporarily unavailable");
    expect(markup).toContain('href="/"');
    expect(markup).toContain("Return home");
  });
});
