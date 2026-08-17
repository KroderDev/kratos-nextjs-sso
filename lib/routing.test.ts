import { describe, expect, it } from "vitest";

import { isAuthLayoutRoute, isDashboardRoute } from "./routing";

describe("routing helpers", () => {
  it("recognizes dashboard routes", () => {
    expect(isDashboardRoute("/dashboard")).toBe(true);
    expect(isDashboardRoute("/dashboard/settings")).toBe(true);
    expect(isDashboardRoute("/dashboard/profile")).toBe(false);
    expect(isDashboardRoute("/auth/dashboard")).toBe(false);
  });

  it("recognizes auth layout routes except dashboard paths", () => {
    expect(isAuthLayoutRoute("/login")).toBe(true);
    expect(isAuthLayoutRoute("/registration?lang=es")).toBe(true);
    expect(isAuthLayoutRoute("/login/continue")).toBe(true);
    expect(isAuthLayoutRoute("/consent")).toBe(true);
    expect(isAuthLayoutRoute("/dashboard")).toBe(false);
    expect(isAuthLayoutRoute("/settings")).toBe(false);
    expect(isAuthLayoutRoute("/auth/login")).toBe(false);
  });
});
