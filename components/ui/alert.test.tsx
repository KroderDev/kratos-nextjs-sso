import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";

describe("alert components", () => {
  it("renders alert content and an optional action", () => {
    const markup = renderToStaticMarkup(
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>Try again.</AlertDescription>
        <AlertAction>Dismiss</AlertAction>
      </Alert>,
    );

    expect(markup).toContain('data-slot="alert"');
    expect(markup).toContain('data-slot="alert-title"');
    expect(markup).toContain('data-slot="alert-description"');
    expect(markup).toContain('data-slot="alert-action"');
    expect(markup).toContain("Something went wrong");
  });
});
