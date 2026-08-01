import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Brand } from "./brand";

describe("Brand", () => {
  it("links to the home page and renders both configured logo variants", () => {
    const markup = renderToStaticMarkup(<Brand className="brand-custom" />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain("brand-custom");
    expect(markup).toContain('src="/next.svg"');
    expect(markup).toContain('src="/next-dark.svg"');
    expect(markup).toContain("Your Platform");
  });

  it("uses inverted text and logo classes when requested", () => {
    const markup = renderToStaticMarkup(<Brand inverted />);

    expect(markup).toContain("text-secondary-foreground");
    expect(markup).toContain('class="size-8 hidden"');
    expect(markup).toContain('class="size-8 block"');
  });
});
