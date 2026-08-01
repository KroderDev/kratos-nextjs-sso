import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card", () => {
  it("renders with data-slot card", () => {
    const markup = renderToStaticMarkup(<Card />);
    expect(markup).toContain('data-slot="card"');
  });

  it("renders default size", () => {
    const markup = renderToStaticMarkup(<Card size="default" />);
    expect(markup).toContain('data-size="default"');
  });

  it("renders sm size", () => {
    const markup = renderToStaticMarkup(<Card size="sm" />);
    expect(markup).toContain('data-size="sm"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<Card className="custom-card" />);
    expect(markup).toContain("custom-card");
  });
});

describe("CardHeader", () => {
  it("renders with data-slot card-header", () => {
    const markup = renderToStaticMarkup(<CardHeader />);
    expect(markup).toContain('data-slot="card-header"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<CardHeader className="custom-header" />);
    expect(markup).toContain("custom-header");
  });
});

describe("CardTitle", () => {
  it("renders with data-slot card-title", () => {
    const markup = renderToStaticMarkup(<CardTitle />);
    expect(markup).toContain('data-slot="card-title"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<CardTitle className="custom-title" />);
    expect(markup).toContain("custom-title");
  });
});

describe("CardDescription", () => {
  it("renders with data-slot card-description", () => {
    const markup = renderToStaticMarkup(<CardDescription />);
    expect(markup).toContain('data-slot="card-description"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<CardDescription className="custom-desc" />);
    expect(markup).toContain("custom-desc");
  });
});

describe("CardAction", () => {
  it("renders with data-slot card-action", () => {
    const markup = renderToStaticMarkup(<CardAction />);
    expect(markup).toContain('data-slot="card-action"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<CardAction className="custom-action" />);
    expect(markup).toContain("custom-action");
  });
});

describe("CardContent", () => {
  it("renders with data-slot card-content", () => {
    const markup = renderToStaticMarkup(<CardContent />);
    expect(markup).toContain('data-slot="card-content"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<CardContent className="custom-content" />);
    expect(markup).toContain("custom-content");
  });
});

describe("CardFooter", () => {
  it("renders with data-slot card-footer", () => {
    const markup = renderToStaticMarkup(<CardFooter />);
    expect(markup).toContain('data-slot="card-footer"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<CardFooter className="custom-footer" />);
    expect(markup).toContain("custom-footer");
  });
});
