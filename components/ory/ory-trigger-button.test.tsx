import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OryTriggerButton } from "./ory-trigger-button";

describe("OryTriggerButton", () => {
  it("forwards button values and renders its children", () => {
    const markup = renderToStaticMarkup(
      <form>
        <OryTriggerButton name="method" trigger="oryPasskeyLogin" value="passkey">
          Use a passkey
        </OryTriggerButton>
      </form>,
    );

    expect(markup).toContain('name="method"');
    expect(markup).toContain('value="passkey"');
    expect(markup).toContain("Use a passkey");
  });

  it("renders without a trigger when no trigger is supplied", () => {
    const markup = renderToStaticMarkup(
      <OryTriggerButton type="button">Continue</OryTriggerButton>,
    );

    expect(markup).toContain('type="button"');
    expect(markup).toContain("Continue");
  });
});
