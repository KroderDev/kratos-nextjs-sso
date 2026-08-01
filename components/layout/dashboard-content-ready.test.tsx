import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardContentReady } from "./dashboard-content-ready";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/settings" }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: vi.fn((fn: () => void) => { fn(); }),
  };
});

describe("DashboardContentReady", () => {
  const mockDispatchEvent = vi.fn();

  beforeEach(() => {
    mockDispatchEvent.mockReset();
    globalThis.window = {
      dispatchEvent: mockDispatchEvent,
      location: { pathname: "/dashboard/settings" },
    } as unknown as Window & typeof globalThis;
  });

  it("renders no visible markup", () => {
    expect(renderToStaticMarkup(<DashboardContentReady />)).toBe("");
  });

  it("dispatches dashboard-content-ready custom event on mount", () => {
    renderToStaticMarkup(<DashboardContentReady />);

    expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    const event = mockDispatchEvent.mock.calls[0][0] as CustomEvent<string>;
    expect(event.type).toBe("dashboard-content-ready");
    expect(event.detail).toBe("/dashboard/settings");
  });
});
