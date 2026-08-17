import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContentReady } from "./auth-content-ready";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: vi.fn((fn: () => void) => { fn(); }),
  };
});

describe("AuthContentReady", () => {
  const mockDispatchEvent = vi.fn();

  beforeEach(() => {
    mockDispatchEvent.mockReset();
    globalThis.window = {
      dispatchEvent: mockDispatchEvent,
      location: { pathname: "/login" },
    } as unknown as Window & typeof globalThis;
  });

  it("renders no visible markup", () => {
    expect(renderToStaticMarkup(<AuthContentReady />)).toBe("");
  });

  it("dispatches auth-content-ready custom event on mount", () => {
    renderToStaticMarkup(<AuthContentReady />);

    expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    const event = mockDispatchEvent.mock.calls[0][0] as CustomEvent<string>;
    expect(event.type).toBe("auth-content-ready");
    expect(event.detail).toBe("/login");
  });

  it("includes the current location pathname in the event detail", () => {
    globalThis.window = {
      dispatchEvent: mockDispatchEvent,
      location: { pathname: "/registration" },
    } as unknown as Window & typeof globalThis;

    renderToStaticMarkup(<AuthContentReady />);

    const event = mockDispatchEvent.mock.calls[0][0] as CustomEvent<string>;
    expect(event.detail).toBe("/registration");
  });
});
