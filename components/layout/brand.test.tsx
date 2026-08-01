import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

let __brandLogoLight = "/next.svg";
let __brandLogoDark = "/next-dark.svg";

vi.mock("@/lib/branding", () => ({
  get brandLogoLight() { return __brandLogoLight; },
  get brandLogoDark() { return __brandLogoDark; },
  brandMark: "YP",
  brandName: "Your Platform",
  brandFaviconLight: "",
  brandFaviconDark: "",
}));

import { Brand } from "./brand";

describe("Brand", () => {
  it("links to the home page and renders both configured logo variants", () => {
    __brandLogoLight = "/next.svg";
    __brandLogoDark = "/next-dark.svg";

    const markup = renderToStaticMarkup(<Brand className="brand-custom" />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain("brand-custom");
    expect(markup).toContain('src="/next.svg"');
    expect(markup).toContain('src="/next-dark.svg"');
    expect(markup).toContain("Your Platform");
  });

  it("uses inverted text and logo classes when requested", () => {
    __brandLogoLight = "/next.svg";
    __brandLogoDark = "/next-dark.svg";

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
    expect(markup).toContain("YP");
    expect(markup).toContain("Your Platform");
    expect(markup).toContain('aria-hidden="true"');
  });

  it("renders brand mark without decorative styling when no logo and inverted", () => {
    __brandLogoLight = "";
    __brandLogoDark = "";

    const markup = renderToStaticMarkup(<Brand inverted />);

    expect(markup).toContain('href="/"');
    expect(markup).not.toContain("<img");
    expect(markup).toContain("YP");
    expect(markup).toContain("text-secondary-foreground");
    expect(markup).not.toContain("place-items-center");
  });
});
