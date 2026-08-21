// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { getClientBrowserLocale } from "./client";

describe("getClientBrowserLocale", () => {
  it("returns undefined when the browser window is unavailable", () => {
    const original = globalThis.window;
    vi.stubGlobal("window", undefined);

    expect(getClientBrowserLocale()).toBeUndefined();

    vi.stubGlobal("window", original);
  });
});
