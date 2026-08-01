import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ory-trigger-runtime", () => ({
  invokeOryTrigger: vi.fn(),
  allowedOryTriggers: new Set(["oryPasskeyLogin"]),
  getOryTriggerKey: vi.fn(),
  OryTriggerRuntime: () => null,
}));

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

  it("renders with formNoValidate when set", () => {
    const markup = renderToStaticMarkup(
      <form>
        <OryTriggerButton name="provider" formNoValidate value="google-provider">
          Sign in with Google
        </OryTriggerButton>
      </form>,
    );

    expect(markup).toContain("formNoValidate");
  });

  it("renders with disabled attribute", () => {
    const markup = renderToStaticMarkup(
      <form>
        <OryTriggerButton name="method" disabled value="password">
          Submit
        </OryTriggerButton>
      </form>,
    );

    expect(markup).toContain("disabled");
  });
});
