import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: vi.fn((fn: () => void) => { fn(); }),
  };
});

import {
  allowedOryTriggers,
  getOryTriggerKey,
  invokeOryTrigger,
  OryTriggerRuntime,
} from "./ory-trigger-runtime";

describe("allowedOryTriggers", () => {
  it("keeps only the supported Ory trigger names allowlisted", () => {
    expect(allowedOryTriggers.has("oryPasskeyLogin")).toBe(true);
    expect(allowedOryTriggers.has("oryWebAuthnLogin")).toBe(true);
    expect(allowedOryTriggers.has("oryPasskeyRegistration")).toBe(true);
    expect(allowedOryTriggers.has("oryPasskeySettingsRegistration")).toBe(true);
    expect(allowedOryTriggers.has("oryPasskeyLoginAutocompleteInit")).toBe(true);
    expect(allowedOryTriggers.has("oryWebAuthnRegistration")).toBe(true);
    expect(allowedOryTriggers.has("eval")).toBe(false);
    expect(allowedOryTriggers.has("alert")).toBe(false);
  });
});

describe("getOryTriggerKey", () => {
  it("creates a stable key from the trigger list", () => {
    expect(getOryTriggerKey(["oryPasskeyLogin", "oryWebAuthnLogin"])).toBe(
      "oryPasskeyLogin|oryWebAuthnLogin",
    );
    expect(getOryTriggerKey([])).toBe("");
  });
});

describe("invokeOryTrigger", () => {
  function setupWindow() {
    vi.restoreAllMocks();
    globalThis.window = {
      setInterval: vi.fn((fn: TimerHandler, ms?: number) => {
        return setInterval(fn, ms);
      }),
      clearInterval: vi.fn((id) => {
        clearInterval(id);
      }),
    } as unknown as Window & typeof globalThis;
  }

  beforeEach(() => {
    setupWindow();
  });

  it("exits early when trigger is undefined", () => {
    invokeOryTrigger(undefined);
    expect(window.setInterval).not.toHaveBeenCalled();
  });

  it("invokes the trigger function immediately when it exists on window", () => {
    const mockFn = vi.fn();
    (globalThis.window as unknown as Record<string, unknown>).oryPasskeyLogin = mockFn;

    invokeOryTrigger("oryPasskeyLogin");

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("polls with setInterval until the trigger function becomes available", () => {
    vi.useFakeTimers();
    setupWindow();
    const mockFn = vi.fn();

    invokeOryTrigger("oryPasskeyLogin");

    (globalThis.window as unknown as Record<string, unknown>).oryPasskeyLogin = mockFn;

    vi.advanceTimersByTime(200);

    expect(mockFn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("gives up polling after 100 attempts", () => {
    vi.useFakeTimers();
    setupWindow();

    invokeOryTrigger("oryPasskeyLogin");

    vi.advanceTimersByTime(100 * 100 + 50);

    expect(window.clearInterval).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("polls for unknown trigger names since the function may become available later", () => {
    vi.useFakeTimers();
    setupWindow();

    invokeOryTrigger("oryPasskeyLogin");

    expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 100);
    vi.useRealTimers();
  });
});

describe("OryTriggerRuntime", () => {
  beforeEach(() => {
    globalThis.window = {
      setInterval: vi.fn((fn: TimerHandler, ms?: number) => {
        return setInterval(fn, ms);
      }),
      clearInterval: vi.fn((id) => {
        clearInterval(id);
      }),
    } as unknown as Window & typeof globalThis;
  });

  it("renders no markup", () => {
    expect(renderToStaticMarkup(<OryTriggerRuntime triggers={[]} />)).toBe("");
  });

  it("invokes triggers on mount", () => {
    const mockFn = vi.fn();
    (globalThis.window as unknown as Record<string, unknown>).oryPasskeyLogin = mockFn;

    renderToStaticMarkup(
      <OryTriggerRuntime triggers={["oryPasskeyLogin"]} />,
    );

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("invokes multiple triggers", () => {
    const mockFn1 = vi.fn();
    const mockFn2 = vi.fn();
    (globalThis.window as unknown as Record<string, unknown>).oryPasskeyLogin = mockFn1;
    (globalThis.window as unknown as Record<string, unknown>).oryWebAuthnLogin = mockFn2;

    renderToStaticMarkup(
      <OryTriggerRuntime triggers={["oryPasskeyLogin", "oryWebAuthnLogin"]} />,
    );

    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });
});
