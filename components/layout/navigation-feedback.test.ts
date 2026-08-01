import { describe, expect, it } from "vitest";

import { shouldClearPendingNavigation } from "./navigation-feedback";

describe("navigation feedback", () => {
  it("clears ordinary route navigation once the target pathname is active", () => {
    expect(shouldClearPendingNavigation("route", "/settings", "/settings")).toBe(true);
  });

  it("keeps document, mismatched, auth, and dashboard navigations pending", () => {
    expect(shouldClearPendingNavigation("document", undefined, "/settings")).toBe(false);
    expect(shouldClearPendingNavigation("route", "/settings", "/dashboard")).toBe(false);
    expect(shouldClearPendingNavigation("route", "/auth/login", "/auth/login")).toBe(false);
    expect(shouldClearPendingNavigation("route", "/dashboard", "/dashboard")).toBe(false);
  });

  it("does not clear a route when the pending kind or target is missing", () => {
    expect(shouldClearPendingNavigation(undefined, undefined, "/settings")).toBe(false);
    expect(shouldClearPendingNavigation("route", undefined, "/settings")).toBe(false);
    expect(shouldClearPendingNavigation("route", "/settings", undefined as never)).toBe(false);
  });
});
