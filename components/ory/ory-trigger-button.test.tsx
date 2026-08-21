// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./ory-trigger-runtime", () => ({
  invokeOryTrigger: vi.fn(),
  isAllowedOryTrigger: (trigger: string | undefined) => trigger === "oryPasskeyLogin",
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

  it("submits a native button action when its provider trigger is unsupported", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <form>
          <OryTriggerButton
            name="method"
            trigger="oryFutureTrigger"
            type="button"
            value="future"
          >
            Continue
          </OryTriggerButton>
        </form>,
      );
    });

    const form = container.querySelector("form");
    const button = container.querySelector("button");
    const requestSubmit = vi.fn();

    expect(form).not.toBeNull();
    expect(button).not.toBeNull();
    form!.requestSubmit = requestSubmit;

    await act(async () => {
      button!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });

    expect(requestSubmit).toHaveBeenCalledTimes(1);
    expect(form?.querySelector('input[name="method"]')?.getAttribute("value")).toBe("future");
    root.unmount();
    container.remove();
  });
});
