// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./ory-trigger-runtime", () => ({
  invokeOryTrigger: vi.fn(),
  isAllowedOryTrigger: (trigger: string | undefined) => trigger === "oryPasskeyLogin",
  allowedOryTriggers: new Set(["oryPasskeyLogin"]),
  getOryTriggerKey: vi.fn(),
  OryTriggerRuntime: () => null,
}));

import { invokeOryTrigger } from "./ory-trigger-runtime";
import { OryTriggerButton } from "./ory-trigger-button";

describe("OryTriggerButton", () => {
  beforeEach(() => {
    vi.mocked(invokeOryTrigger).mockClear();
  });

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

  it("invokes an allowlisted trigger and updates an existing form value", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <form>
          <input name="method" defaultValue="password" />
          <OryTriggerButton
            name="method"
            trigger="oryPasskeyLogin"
            value="passkey"
          >
            Use a passkey
          </OryTriggerButton>
        </form>,
      );
    });

    const button = container.querySelector<HTMLButtonElement>("button");
    expect(button).not.toBeNull();
    const existingInput = button?.form?.querySelector<HTMLInputElement>('input[name="method"]');
    expect(existingInput).not.toBeNull();
    vi.spyOn(button!.form!.elements, "namedItem").mockReturnValue(existingInput!);

    await act(async () => {
      button?.click();
    });

    expect(existingInput?.value).toBe("passkey");
    expect(vi.mocked(invokeOryTrigger)).toHaveBeenCalledWith("oryPasskeyLogin");
    root.unmount();
    container.remove();
    vi.mocked(invokeOryTrigger).mockClear();
  });

  it("clears an existing form value when the trigger value is omitted", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <form>
          <input name="method" defaultValue="password" />
          <OryTriggerButton name="method" trigger="oryPasskeyLogin">
            Use a passkey
          </OryTriggerButton>
        </form>,
      );
    });

    const button = container.querySelector<HTMLButtonElement>("button");
    const existingInput = button?.form?.querySelector<HTMLInputElement>('input[name="method"]');
    expect(button).not.toBeNull();
    expect(existingInput).not.toBeNull();
    vi.spyOn(button!.form!.elements, "namedItem").mockReturnValue(existingInput!);

    await act(async () => {
      button?.click();
    });

    expect(existingInput?.value).toBe("");
    expect(vi.mocked(invokeOryTrigger)).toHaveBeenCalledWith("oryPasskeyLogin");
    root.unmount();
    container.remove();
  });

  it("does not invoke a trigger when the click handler already prevented it", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const onClick = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    });

    await act(async () => {
      root.render(
        <OryTriggerButton onClick={onClick} trigger="oryPasskeyLogin">
          Continue
        </OryTriggerButton>,
      );
    });

    await act(async () => {
      container.querySelector("button")?.click();
    });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(invokeOryTrigger).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
  });

  it("leaves native submission behavior unchanged without a trigger", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const requestSubmit = vi.fn();

    await act(async () => {
      root.render(
        <form>
          <OryTriggerButton type="button">Continue</OryTriggerButton>
        </form>,
      );
    });

    const form = container.querySelector("form");
    const button = container.querySelector<HTMLButtonElement>("button");
    expect(form).not.toBeNull();
    expect(button).not.toBeNull();
    form!.requestSubmit = requestSubmit;

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    await act(async () => {
      button?.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(false);
    expect(requestSubmit).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
  });

  it("safely ignores a form value when an allowed trigger has no form", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <OryTriggerButton name="method" trigger="oryPasskeyLogin" value="passkey">
          Use a passkey
        </OryTriggerButton>,
      );
    });

    const button = container.querySelector<HTMLButtonElement>("button");
    expect(button).not.toBeNull();
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    await act(async () => {
      button?.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(invokeOryTrigger).toHaveBeenCalledWith("oryPasskeyLogin");
    root.unmount();
    container.remove();
  });

  it("leaves unsupported submit triggers to native form behavior", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <form>
          <OryTriggerButton name="method" trigger="oryFutureTrigger">
            Continue
          </OryTriggerButton>
        </form>,
      );
    });

    const button = container.querySelector<HTMLButtonElement>("button");
    expect(button).not.toBeNull();
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    await act(async () => {
      button?.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(false);
    root.unmount();
    container.remove();
  });

  it("uses an empty fallback value when an unsupported trigger has no value", async () => {
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
          >
            Continue
          </OryTriggerButton>
        </form>,
      );
    });

    const form = container.querySelector("form");
    const button = container.querySelector<HTMLButtonElement>("button");
    const requestSubmit = vi.fn();
    expect(form).not.toBeNull();
    expect(button).not.toBeNull();
    form!.requestSubmit = requestSubmit;

    await act(async () => {
      button?.click();
    });

    expect(form?.querySelector<HTMLInputElement>('input[name="method"]')?.value).toBe("");
    expect(requestSubmit).toHaveBeenCalledTimes(1);
    root.unmount();
    container.remove();
  });

  it("creates a hidden value when the named form control is absent", async () => {
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
    const button = container.querySelector<HTMLButtonElement>("button");
    const requestSubmit = vi.fn();
    expect(form).not.toBeNull();
    expect(button).not.toBeNull();
    vi.spyOn(form!.elements, "namedItem").mockReturnValue(button!);
    form!.requestSubmit = requestSubmit;

    await act(async () => button?.click());

    expect(form?.querySelector<HTMLInputElement>('input[name="method"]')?.value).toBe("future");
    expect(requestSubmit).toHaveBeenCalledTimes(1);
    root.unmount();
    container.remove();
  });

  it("falls back to a hidden control when a named control is not an input", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <form>
          <input name="method" defaultValue="password" />
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
    const button = container.querySelector<HTMLButtonElement>("button");
    const requestSubmit = vi.fn();

    expect(form).not.toBeNull();
    expect(button).not.toBeNull();
    vi.spyOn(form!.elements, "namedItem").mockReturnValue(button);
    form!.requestSubmit = requestSubmit;

    await act(async () => button?.click());

    expect(form?.querySelectorAll('input[name="method"]').length).toBe(2);
    expect(requestSubmit).toHaveBeenCalledTimes(1);
    root.unmount();
    container.remove();
  });
});
