import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

let __brandLogoLight = "";
let __brandLogoDark = "";

vi.mock("@/lib/branding", () => ({
  get brandLogoLight() { return __brandLogoLight; },
  get brandLogoDark() { return __brandLogoDark; },
  brandMark: "KS",
  brandName: "Kratos SSO",
  brandFaviconLight: "",
  brandFaviconDark: "",
}));

import { Brand } from "./brand";

describe("Brand", () => {
  it("links to the home page and renders both configured logo variants", () => {
    __brandLogoLight = "/custom-light.svg";
    __brandLogoDark = "/custom-dark.svg";

    const markup = renderToStaticMarkup(<Brand className="brand-custom" />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain("brand-custom");
    expect(markup).toContain('src="/custom-light.svg"');
    expect(markup).toContain('src="/custom-dark.svg"');
    expect(markup).toContain("Kratos SSO");
  });

  it("uses inverted text and logo classes when requested", () => {
    __brandLogoLight = "/custom-light.svg";
    __brandLogoDark = "/custom-dark.svg";

    const markup = renderToStaticMarkup(<Brand inverted />);

    expect(markup).toContain("text-secondary-foreground");
    expect(markup).toContain('class="size-8 hidden"');
    expect(markup).toContain('class="size-8 block"');
  });

  it("renders brand mark when no logo is configured", () => {
    __brandLogoLight = "";
    __brandLogoDark = "";

    const markup = renderToStaticMarkup(<Brand />);

    expect(markup).toContain('href="/"');
    expect(markup).not.toContain("<img");
    expect(markup).toContain("KS");
    expect(markup).toContain("Kratos SSO");
    expect(markup).toContain('aria-hidden="true"');
  });

  it("renders brand mark without decorative styling when no logo and inverted", () => {
    __brandLogoLight = "";
    __brandLogoDark = "";

    const markup = renderToStaticMarkup(<Brand inverted />);

    expect(markup).toContain('href="/"');
    expect(markup).not.toContain("<img");
    expect(markup).toContain("KS");
    expect(markup).toContain("text-secondary-foreground");
    expect(markup).not.toContain("place-items-center");
  });
});
