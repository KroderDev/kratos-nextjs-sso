import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FlowUnavailable } from "./flow-unavailable";

describe("FlowUnavailable", () => {
  it("renders the unavailable-flow alert", () => {
    const markup = renderToStaticMarkup(<FlowUnavailable />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("This flow is no longer available");
    expect(markup).toContain("Start again from the beginning");
  });
});
