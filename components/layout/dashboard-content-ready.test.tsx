import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DashboardContentReady } from "./dashboard-content-ready";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/settings" }));

describe("DashboardContentReady", () => {
  it("renders no visible markup", () => {
    expect(renderToStaticMarkup(<DashboardContentReady />)).toBe("");
  });
});
