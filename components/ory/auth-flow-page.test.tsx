import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import type { OryFlow } from "@/lib/ory/types";

import { AuthFlowPage } from "./auth-flow-page";

vi.mock("@/components/layout/auth-shell", () => ({
  AuthContent: ({ children, footer, title }: { children: React.ReactNode; footer?: React.ReactNode; title: string }) => (
    <section><h1>{title}</h1>{children}{footer}</section>
  ),
}));
vi.mock("./flow-form", () => ({
  FlowForm: ({ kind }: { kind: string }) => <div>flow form: {kind}</div>,
}));
vi.mock("./flow-unavailable", () => ({
  FlowUnavailable: () => <div>flow unavailable</div>,
}));

describe("AuthFlowPage", () => {
  const props = {
    description: "Enter your details",
    eyebrow: "Sign in",
    kind: "login" as const,
    title: "Welcome",
  };

  it("renders the flow form when a flow is available", () => {
    const flow = { id: "flow-id", ui: {} } as OryFlow;
    const markup = renderToStaticMarkup(
      <AuthFlowPage {...props} flow={flow} footer={<span>Footer</span>} />,
    );

    expect(markup).toContain("Welcome");
    expect(markup).toContain("flow form: login");
    expect(markup).toContain("Footer");
    expect(markup).not.toContain("flow unavailable");
  });

  it("renders the unavailable state when no flow exists", () => {
    const markup = renderToStaticMarkup(<AuthFlowPage {...props} flow={null} />);

    expect(markup).toContain("flow unavailable");
    expect(markup).not.toContain("flow form");
  });
});
